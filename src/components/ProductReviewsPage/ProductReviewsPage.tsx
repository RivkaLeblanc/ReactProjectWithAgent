import { useState, useEffect } from "react";
import "./ProductReviewsPage.css";

const API = import.meta.env.VITE_API_URL;

type Review = {
  id: number;
  product_id: string;
  user_id: number;
  rating: number;
  comment: string;
};

type ReviewsProps = {
  productId: string;
};

const ProductReviewsPage = ({ productId }: ReviewsProps) => {
  const [productsReviews, setProductsReviews] = useState<Review[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);

  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);

  const [editComment, setEditComment] = useState("");

  const [editRating, setEditRating] = useState(5);

  const userId = Number(localStorage.getItem("userId"));
  const userRole = localStorage.getItem("userRole");

  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `${API}/reviews?product_id=${productId}`
      );
      const data = await response.json();
      setProductsReviews(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);


  const handleAddReview = async () => {
    if (!newComment.trim()) return;

    const newReview: Review = {
      id: Math.floor(Math.random() * 100000),
      product_id: productId,
      user_id: userId,
      rating: newRating,
      comment: newComment,
    };

    await fetch(`${API}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newReview),
    });

    setNewComment("");
    setNewRating(5);
    fetchReviews();
  };


  const handleDelete = async (id: number) => {
    await fetch(`${API}/reviews/${id}`, {
    });
    fetchReviews();
  };


  const startEdit = (review: Review) => {
    setEditingReviewId(review.id);
    setEditComment(review.comment);
    setEditRating(review.rating);
  };


  const cancelEdit = () => {
    setEditingReviewId(null);
    setEditComment("");
    setEditRating(5);
  };

  const saveEdit = async (reviewId: number) => {
    if (!editComment.trim()) return;

    await fetch(`${API}/reviews/${reviewId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...productsReviews.find(r => r.id === reviewId),
        comment: editComment,
        rating: editRating
      }),
    });

    cancelEdit();
    fetchReviews();
  };

  return (
    <div className="reviews-section">
      <div className="reviews-header">
        <h3>Customer Reviews</h3>
      </div>

      {productsReviews.length === 0 && (
        <div className="no-reviews">
          <p>No reviews yet. Be the first to review this product!</p>
        </div>
      )}

      <div className="reviews-list">
        {productsReviews.map((review) => (
          <div key={review.id} className="review-card">

            {editingReviewId === review.id ? (
              
              <div className="edit-review-form">
                <div className="rating-select">
                  <label>Rating:</label>
                  <select
                    value={editRating}
                    onChange={(e) => setEditRating(Number(e.target.value))}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
                    <option value={4}>⭐⭐⭐⭐ (4)</option>
                    <option value={3}>⭐⭐⭐ (3)</option>
                    <option value={2}>⭐⭐ (2)</option>
                    <option value={1}>⭐ (1)</option>
                  </select>
                </div>
                <textarea
                  className="review-textarea"
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                />
                <div className="review-actions">
                  <button onClick={() => saveEdit(review.id)}>Save</button>
                  <button onClick={cancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              
              <>
                <div className="review-header">
                  <div className="review-rating">
                    {"⭐".repeat(review.rating)} ({review.rating}/5)
                  </div>
                </div>
                <p className="review-comment">{review.comment}</p>

                {review.user_id === userId && (
                  <div className="review-actions">
                    <button onClick={() => startEdit(review)}>Edit</button>
                    <button onClick={() => handleDelete(review.id)}>Delete</button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {userRole === "user" && (
        <div className="add-review-section">
          <h4>Write a Review</h4>

          <div className="rating-select">
            <label>Rating:</label>
            <select
              value={newRating}
              onChange={(e) => setNewRating(Number(e.target.value))}
            >
              <option value={5}>⭐⭐⭐⭐⭐ (5)</option>
              <option value={4}>⭐⭐⭐⭐ (4)</option>
              <option value={3}>⭐⭐⭐ (3)</option>
              <option value={2}>⭐⭐ (2)</option>
              <option value={1}>⭐ (1)</option>
            </select>
          </div>

          <textarea
            className="review-textarea"
            placeholder="Share your experience with this product..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />

          <button className="submit-review-btn" onClick={handleAddReview}>
            Submit Review
          </button>
        </div>
      )}

      {userRole === "admin" && (
        <div className="admin-message">
          <p>Admins cannot add reviews.</p>
        </div>
      )}
    </div>
  );
};

export default ProductReviewsPage;
