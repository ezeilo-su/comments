const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { randomBytes } = require('crypto');
const axios = require('axios');
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

  const comments = commentsByPostId[postId] || [];

  comments.push({ id: commentId, content });

  commentsByPostId[postId] = comments;

  await axios.post('http://localhost:4005/events', {
    type: 'CommentCreated',
    data: {
      id: commentId,
      content,
      postId,
    },
  });

  res.status(201).send(comments);
});

app.post('/events', (req, res) => {
  res.status(200).json({});
});

app.listen(4001, () => {
  console.log('Listening on port 4001');
});
