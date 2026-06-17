package monitoring

import (
	"fmt"
	"time"

	"github.com/getsentry/sentry-go"
	"github.com/gin-gonic/gin"
)

// SentryConfig represents Sentry configuration
type SentryConfig struct {
	DSN              string
	Environment      string
	Release          string
	TracesSampleRate float64
	Debug            bool
}

// InitSentry initializes Sentry error tracking
func InitSentry(config *SentryConfig) error {
	err := sentry.Init(sentry.ClientOptions{
		Dsn:              config.DSN,
		Environment:      config.Environment,
		Release:          config.Release,
		TracesSampleRate: config.TracesSampleRate,
		Debug:            config.Debug,
		BeforeSend: func(event *sentry.Event, hint *sentry.EventHint) *sentry.Event {
			// Filter out sensitive data
			if event.Request != nil {
				// Remove authorization headers
				if event.Request.Headers != nil {
					delete(event.Request.Headers, "Authorization")
					delete(event.Request.Headers, "Cookie")
				}
			}
			return event
		},
	})

	if err != nil {
		return fmt.Errorf("failed to initialize Sentry: %w", err)
	}

	return nil
}

// SentryMiddleware creates a Gin middleware for Sentry
func SentryMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Create a new hub for this request
		hub := sentry.CurrentHub().Clone()
		hub.Scope().SetRequest(c.Request)
		hub.Scope().SetTag("path", c.Request.URL.Path)
		hub.Scope().SetTag("method", c.Request.Method)

		// Add user context if available
		// key 必须对齐 AuthMiddleware 写入的 "user_id"（见 middleware/auth.go:48），否则永远绑不上用户
		if userID, exists := c.Get("user_id"); exists {
			hub.Scope().SetUser(sentry.User{
				ID: fmt.Sprintf("%v", userID),
			})
		}

		// Store hub in context
		c.Set("sentry_hub", hub)

		// Recover from panics
		defer func() {
			if err := recover(); err != nil {
				hub.RecoverWithContext(c.Request.Context(), err)
				c.AbortWithStatusJSON(500, gin.H{
					"success": false,
					"error": gin.H{
						"code":    500,
						"message": "Internal server error",
					},
				})
			}
		}()

		c.Next()

		// Capture errors from the request
		if len(c.Errors) > 0 {
			for _, err := range c.Errors {
				hub.CaptureException(err.Err)
			}
		}
	}
}

// CaptureError captures an error to Sentry
func CaptureError(c *gin.Context, err error) {
	if hub, exists := c.Get("sentry_hub"); exists {
		if sentryHub, ok := hub.(*sentry.Hub); ok {
			sentryHub.CaptureException(err)
		}
	} else {
		sentry.CaptureException(err)
	}
}

// CaptureMessage captures a message to Sentry
func CaptureMessage(c *gin.Context, message string, level sentry.Level) {
	if hub, exists := c.Get("sentry_hub"); exists {
		if sentryHub, ok := hub.(*sentry.Hub); ok {
			sentryHub.CaptureMessage(message)
		}
	} else {
		sentry.CaptureMessage(message)
	}
}

// AddBreadcrumb adds a breadcrumb to Sentry
func AddBreadcrumb(c *gin.Context, breadcrumb *sentry.Breadcrumb) {
	if hub, exists := c.Get("sentry_hub"); exists {
		if sentryHub, ok := hub.(*sentry.Hub); ok {
			sentryHub.AddBreadcrumb(breadcrumb, nil)
		}
	}
}

// FlushSentry flushes Sentry events
func FlushSentry(timeout time.Duration) {
	sentry.Flush(timeout)
}
