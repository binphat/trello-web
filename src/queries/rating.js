import { gql } from '@apollo/client'

// Mutation để tạo đánh giá
export const CREATE_RATING = gql`
  mutation CreateRating($ratedUserId: ID!, $boardId: ID!, $score: Int!, $comment: String) {
    createRating(ratedUserId: $ratedUserId, boardId: $boardId, score: $score, comment: $comment) {
      _id
    }
  }
`

// Query để lấy các đánh giá của người dùng trong 1 board
export const GET_USER_RATINGS = gql`
  query GetUserRatings($userId: ID!, $boardId: ID!) {
    getUserRatings(userId: $userId, boardId: $boardId) {
      _id
      score
      comment
      rater {
        _id
        username
        avatar
      }
    }
  }
`
