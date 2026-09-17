const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const activityRepository = require('../repositories/activityRepository');
const { signToken } = require('../middleware/auth');
const ApiError = require('../utils/ApiError');

const SALT_ROUNDS = 12;

async function register({ username, email, password }) {
  const existing = await userRepository.findByEmailOrUsername(email);
  const existingByUsername = await userRepository.findByEmailOrUsername(username);
  if (existing || existingByUsername) {
    throw new ApiError(409, 'An account with that email or username already exists.');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepository.create({ username, email, passwordHash });
  await activityRepository.log(user.id, 'register', { username });

  const token = signToken(user);
  return { token, user };
}

async function login({ identifier, password }) {
  const user = await userRepository.findByEmailOrUsername(identifier);
  if (!user) {
    throw new ApiError(401, 'Invalid credentials.');
  }
  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    throw new ApiError(401, 'Invalid credentials.');
  }

  await userRepository.touchLastLogin(user.id);
  await activityRepository.log(user.id, 'login', {});

  const token = signToken(user);
  const { password_hash, ...safeUser } = user;
  return { token, user: safeUser };
}

async function me(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw new ApiError(404, 'User not found.');
  const { password_hash, ...safeUser } = user;
  return safeUser;
}

module.exports = { register, login, me };
