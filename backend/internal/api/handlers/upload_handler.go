package handlers

import (
	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/MICBIK/TZBlog/backend/pkg/storage"
	"github.com/gin-gonic/gin"
)

type UploadHandler struct {
	storage *storage.R2Storage
}

func NewUploadHandler(storage *storage.R2Storage) *UploadHandler {
	return &UploadHandler{storage: storage}
}

func (h *UploadHandler) UploadImage(c *gin.Context) {
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		response.BadRequest(c, "No image file provided")
		return
	}
	defer file.Close()

	imageURL, err := h.storage.UploadImage(file, header)
	if err != nil {
		response.BadRequest(c, err.Error())
		return
	}

	response.Success(c, gin.H{
		"url": imageURL,
	})
}
