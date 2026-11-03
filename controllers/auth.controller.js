import { registration } from "../services/reg.services.js";
import { login } from "../services/login.services.js";

export async function registerUser(req,res) {
    const result = await registration(req.body);
    res.json(result);

}
export async function loginUser(req, res) {
  const { status = 200, ...body } = await login(req.body);
  res.status(status).json(body);
}