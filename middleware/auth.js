import jwt from 'jsonwebtoken';
import dotenv from "dotenv";

dotenv.config();

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        console.log('Token missing from header');
        return res.status(401).send({ error: 'Authorization token is required' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.message === 'jwt expired') {
            return res.status(401).send({ error: 'Token expired' });
        }
        console.log('Token verification error:', error);
        res.status(401).send({ error: 'Invalid token' });
    }
};

export default authMiddleware;
