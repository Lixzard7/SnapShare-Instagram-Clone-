#  SnapShare (Instagram Clone)

A full-stack **Mini Instagram-style application** built using **Node.js, Express, MongoDB, and React**. This project supports authentication, following users, creating posts, liking, commenting, and viewing a personalized feed.


---


##  Features


###  Authentication
- User Signup
- User Login
- Password Hashing (bcrypt)
- JWT-based Authentication


###  Social Features
- Follow / Unfollow users
- View follower & following counts


###  Posts
- Create posts (Image URL + Caption)
- Like / Unlike posts
- Comment on posts


###  Feed
- Personalized feed
- Shows posts only from followed users


---


##  Tech Stack


### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT
- bcryptjs


### Frontend
- React
- Axios
- React Router DOM


---


##  Backend Setup


```bash
npm install
npx nodemon server.js
http://localhost:5000

🔌 API Endpoints
Auth

POST /auth/signup

POST /auth/login

Users

POST /users/follow/:id

POST /users/unfollow/:id

Posts

POST /posts

POST /posts/:id/like

POST /posts/:id/unlike

POST /posts/:id/comment

GET /posts/feed

Testing

Use Postman for backend testing

Ensure token is passed as: Authorization: Bearer <your_token>

Future Enhancements

Image Upload (Cloudinary)

Notifications

Infinite Scroll

Dark Mode

Author

Sarthak Soni
B.Tech – Computer Science
