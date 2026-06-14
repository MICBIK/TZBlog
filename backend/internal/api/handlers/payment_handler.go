package handlers

import (
	"time"

	"github.com/MICBIK/TZBlog/backend/internal/domain/payment"
	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type PaymentHandler struct {
	paymentRepo    payment.PaymentRepository
	membershipRepo payment.MembershipRepository
	stripeService  StripeService
}

type StripeService interface {
	CreateCheckoutSession(userID int64, tier payment.MembershipTier) (string, error)
	CreatePortalSession(userID int64) (string, error)
	HandleWebhook(payload []byte, signature string) error
}

func NewPaymentHandler(
	paymentRepo payment.PaymentRepository,
	membershipRepo payment.MembershipRepository,
	stripeService StripeService,
) *PaymentHandler {
	return &PaymentHandler{
		paymentRepo:    paymentRepo,
		membershipRepo: membershipRepo,
		stripeService:  stripeService,
	}
}

type CreateCheckoutRequest struct {
	Tier string `json:"tier" binding:"required,oneof=basic premium lifetime"`
}

// CreateCheckoutSession creates a Stripe checkout session
// @Summary Create checkout session
// @Tags Payment
// @Security Bearer
// @Param request body CreateCheckoutRequest true "Tier"
// @Success 200 {object} response.Response{data=gin.H{url=string}}
// @Router /payment/checkout [post]
func (h *PaymentHandler) CreateCheckoutSession(c *gin.Context) {
	userID := c.GetInt64("userID")

	var req CreateCheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	// Check if user already has an active membership
	membership, _ := h.membershipRepo.FindByUserID(userID)
	if membership != nil && membership.IsActive() && membership.Tier != payment.TierFree {
		response.BadRequest(c, "You already have an active membership")
		return
	}

	tier := payment.MembershipTier(req.Tier)
	sessionURL, err := h.stripeService.CreateCheckoutSession(userID, tier)
	if err != nil {
		response.InternalError(c, "Failed to create checkout session")
		return
	}

	response.Success(c, gin.H{"url": sessionURL})
}

// CreatePortalSession creates a Stripe customer portal session
// @Summary Create customer portal session
// @Tags Payment
// @Security Bearer
// @Success 200 {object} response.Response{data=gin.H{url=string}}
// @Router /payment/portal [post]
func (h *PaymentHandler) CreatePortalSession(c *gin.Context) {
	userID := c.GetInt64("userID")

	sessionURL, err := h.stripeService.CreatePortalSession(userID)
	if err != nil {
		response.InternalError(c, "Failed to create portal session")
		return
	}

	response.Success(c, gin.H{"url": sessionURL})
}

// StripeWebhook handles Stripe webhook events
// @Summary Handle Stripe webhook
// @Tags Payment
// @Accept json
// @Param payload body string true "Stripe event payload"
// @Success 200 {string} string "ok"
// @Router /payment/webhook [post]
func (h *PaymentHandler) StripeWebhook(c *gin.Context) {
	payload, err := c.GetRawData()
	if err != nil {
		c.String(400, "Invalid payload")
		return
	}

	signature := c.GetHeader("Stripe-Signature")
	if signature == "" {
		c.String(400, "Missing signature")
		return
	}

	err = h.stripeService.HandleWebhook(payload, signature)
	if err != nil {
		c.String(400, "Webhook error: "+err.Error())
		return
	}

	c.String(200, "ok")
}

// GetPaymentHistory returns user's payment history
// @Summary Get payment history
// @Tags Payment
// @Security Bearer
// @Param limit query int false "Limit" default(20)
// @Param offset query int false "Offset" default(0)
// @Success 200 {object} response.Response
// @Router /payment/history [get]
func (h *PaymentHandler) GetPaymentHistory(c *gin.Context) {
	userID := c.GetInt64("userID")

	limit := 20
	offset := 0

	payments, total, err := h.paymentRepo.FindByUserID(userID, limit, offset)
	if err != nil {
		response.InternalError(c, "Failed to get payment history")
		return
	}

	response.Success(c, gin.H{
		"payments": payments,
		"total":    total,
		"limit":    limit,
		"offset":   offset,
	})
}

// GetMembership returns user's membership information
// @Summary Get membership information
// @Tags Payment
// @Security Bearer
// @Success 200 {object} response.Response{data=payment.Membership}
// @Router /membership [get]
func (h *PaymentHandler) GetMembership(c *gin.Context) {
	userID := c.GetInt64("userID")

	membership, err := h.membershipRepo.FindByUserID(userID)
	if err != nil {
		response.InternalError(c, "Failed to get membership")
		return
	}

	if membership == nil {
		// Create default free membership
		membership = &payment.Membership{
			UserID:    userID,
			Tier:      payment.TierFree,
			Status:    "active",
			StartDate: time.Now(),
		}
		_ = h.membershipRepo.Create(membership)
	}

	response.Success(c, membership)
}

// CancelMembership cancels user's membership
// @Summary Cancel membership
// @Tags Payment
// @Security Bearer
// @Success 200 {object} response.Response
// @Router /membership/cancel [post]
func (h *PaymentHandler) CancelMembership(c *gin.Context) {
	userID := c.GetInt64("userID")

	err := h.membershipRepo.Cancel(userID)
	if err != nil {
		response.InternalError(c, "Failed to cancel membership")
		return
	}

	response.Success(c, gin.H{"message": "Membership canceled successfully"})
}
