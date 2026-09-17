const authService = require('../services/authService');
const { validateRegister, validateLogin } = require('../validators/authValidators');
const asyncHandler = require('../utils/asyncHandler');
const { ok, created } = require('../utils/apiResponse');

const register = asyncHandler(async (req, res) => {
  const payload = validateRegister(req.body);
  const { token, user } = await authService.register(payload);
  created(res, { token, user });
});

const login = asyncHandler(async (req, res) => {
  const payload = validateLogin(req.body);
  const { token, user } = await authService.login(payload);
  ok(res, { token, user });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.me(req.user.id);
  ok(res, { user });
});

const logout = asyncHandler(async (req, res) => {
  // Stateless JWT — logout is a client-side token discard. Endpoint kept
  // for API symmetry / future refresh-token revocation.
  ok(res, { message: 'Logged out.' });
});

module.exports = { register, login, me, logout };
