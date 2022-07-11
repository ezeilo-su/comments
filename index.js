const express = require('express');
const morgan = require('morgan');
const axios = require('axios');
const cors = require('cors');
require('express-async-errors');
const { randomBytes } = require('crypto');
const { json, urlencoded } = express;

const commentsByPostId = {};

const app = express();

app.use(cors());
app.use(morgan('tiny'));
app.use(urlencoded({ extended: true }));
app.use(json());

app.get('/posts/:id/comments', async (req, res) => {
  res.status(200).send(commentsByPostId[req.params.id] || []);
});

app.post('/posts/:id/comments', async (req, res) => {
  const commentId = randomBytes(4).toString('hex');
  const { content } = req.body;
  const postId = req.params.id;

  const newComment = {
    id: commentId,
    content,
    status: 'pending',
  };

  const comments = commentsByPostId[postId] || [];

  comments.push(newComment);

  commentsByPostId[postId] = comments;
  try {

    await axios.post('http://event-bus-srv:4005/events', {
      type: 'CommentCreated',
      data: {
        postId,
        ...newComment,
      },
    });
    res.status(201).send(comments);    
  } catch (error) {
    console.log(error);
  }
});

app.post('/events', async (req, res) => {
  const { type, data } = req.body;

  if (type === 'CommentModerated') {
    const { id, postId, status, content } = data;
    const comments = commentsByPostId[postId];
    const comment = comments.find((comment) => comment.id === id);

    if (comment) comment.status = status;
    try {
      await axios.post('http://event-bus-srv:4005/events', {
        type: 'CommentUpdated',
        data: {
          id,
          status,
          postId,
          content,
        },
      });      
      res.status(200).json({});
    } catch (error) {
      console.log(error);
    }
  }
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });

  console.log(err.message);
});

app.listen(4001, () => {
  console.log('Listening on port 4001');
});
