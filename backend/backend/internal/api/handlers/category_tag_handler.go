package handlers

import (
	"github.com/MICBIK/TZBlog/backend/internal/domain/category"
	"github.com/MICBIK/TZBlog/backend/internal/domain/tag"
	"github.com/MICBIK/TZBlog/backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/gosimple/slug"
	"strconv"
)

type CategoryHandler struct {
	categoryRepo category.CategoryRepository
}

func NewCategoryHandler(categoryRepo category.CategoryRepository) *CategoryHandler {
	return &CategoryHandler{categoryRepo: categoryRepo}
}

type CreateCategoryRequest struct {
	Name        string `json:"name" binding:"required,max=100"`
	Description string `json:"description"`
	ParentID    *int64 `json:"parent_id"`
	Icon        string `json:"icon"`
}

func (h *CategoryHandler) ListCategories(c *gin.Context) {
	categories, err := h.categoryRepo.FindAll()
	if err != nil {
		response.InternalError(c, "Failed to get categories")
		return
	}
	response.Success(c, categories)
}

func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var req CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	newCategory := &category.Category{
		Name:        req.Name,
		Slug:        slug.Make(req.Name),
		Description: req.Description,
		ParentID:    req.ParentID,
		Icon:        req.Icon,
	}

	if err := h.categoryRepo.Create(newCategory); err != nil {
		response.InternalError(c, "Failed to create category")
		return
	}

	response.Success(c, newCategory)
}

type TagHandler struct {
	tagRepo tag.TagRepository
}

func NewTagHandler(tagRepo tag.TagRepository) *TagHandler {
	return &TagHandler{tagRepo: tagRepo}
}

type CreateTagRequest struct {
	Name  string `json:"name" binding:"required,max=50"`
	Color string `json:"color" binding:"omitempty,len=7"`
}

func (h *TagHandler) ListTags(c *gin.Context) {
	tags, err := h.tagRepo.FindAll()
	if err != nil {
		response.InternalError(c, "Failed to get tags")
		return
	}
	response.Success(c, tags)
}

func (h *TagHandler) CreateTag(c *gin.Context) {
	var req CreateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.BadRequest(c, "Invalid request")
		return
	}

	newTag := &tag.Tag{
		Name:  req.Name,
		Slug:  slug.Make(req.Name),
		Color: req.Color,
	}

	if err := h.tagRepo.Create(newTag); err != nil {
		response.InternalError(c, "Failed to create tag")
		return
	}

	response.Success(c, newTag)
}
