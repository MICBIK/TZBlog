package handlers

import (
	"github.com/MICBIK/TZBlog/backend/internal/domain/subscription"
	"github.com/MICBIK/TZBlog/backend/internal/api/response"
	"github.com/gin-gonic/gin"
)

type SubscriptionHandler struct {
	subscriptionRepo subscription.SubscriptionRepository
	emailService     EmailService
}

type EmailService interface {
	SendVerificationEmail(email, token string) error
	SendNewsletterEmail(email, subject, content string) error
}

func NewSubscriptionHandler(subscriptionRepo subscription.SubscriptionRepository, emailService EmailService) *SubscriptionHandler {
	return &SubscriptionHandler{
		subscriptionRepo: subscriptionRepo,
		emailService:     emailService,
	}
}

type SubscribeRequest struct {
	Email string `json:"email" binding:"required,email"`
}

// Subscribe subscribes an email to the newsletter
// @Summary Subscribe to newsletter
// @Tags Subscription
// @Param request body SubscribeRequest true "Email"
// @Success 200 {object} response.Response
// @Router       /api/v1/subscribe [post]
func (h *SubscriptionHandler) Subscribe(c *gin.Context) {
	var req SubscribeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid email")
		return
	}

	// Check if already subscribed
	existing, _ := h.subscriptionRepo.FindByEmail(req.Email)
	if existing != nil {
		if existing.Status == "active" {
			response.BadRequest(c, "Email already subscribed")
			return
		}
	}

	// Create subscription
	sub, err := h.subscriptionRepo.Subscribe(req.Email)
	if err != nil {
		response.InternalError(c, "Failed to subscribe")
		return
	}

	// Send verification email
	err = h.emailService.SendVerificationEmail(sub.Email, sub.Token)
	if err != nil {
		response.InternalError(c, "Failed to send verification email")
		return
	}

	response.Success(c, gin.H{
		"message": "Subscription successful. Please check your email to verify.",
	})
}

// Verify verifies an email subscription
// @Summary Verify email subscription
// @Tags Subscription
// @Param token query string true "Verification token"
// @Success 200 {object} response.Response
// @Router       /api/v1/subscribe/verify [get]
func (h *SubscriptionHandler) Verify(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		response.BadRequest(c, "Token is required")
		return
	}

	err := h.subscriptionRepo.Verify(token)
	if err != nil {
		response.BadRequest(c, "Invalid or expired token")
		return
	}

	response.Success(c, gin.H{
		"message": "Email verified successfully!",
	})
}

// Unsubscribe unsubscribes an email from the newsletter
// @Summary Unsubscribe from newsletter
// @Tags Subscription
// @Param token query string true "Unsubscribe token"
// @Success 200 {object} response.Response
// @Router       /api/v1/unsubscribe [get]
func (h *SubscriptionHandler) Unsubscribe(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		response.BadRequest(c, "Token is required")
		return
	}

	err := h.subscriptionRepo.Unsubscribe(token)
	if err != nil {
		response.BadRequest(c, "Invalid token")
		return
	}

	response.Success(c, gin.H{
		"message": "Successfully unsubscribed",
	})
}

// GetSubscriberCount returns the number of active subscribers
// @Summary Get subscriber count
// @Tags Subscription
// @Success 200 {object} response.Response
// @Router       /api/v1/subscribe/count [get]
func (h *SubscriptionHandler) GetSubscriberCount(c *gin.Context) {
	count, err := h.subscriptionRepo.GetCount()
	if err != nil {
		response.InternalError(c, "Failed to get count")
		return
	}

	response.Success(c, gin.H{"count": count})
}
