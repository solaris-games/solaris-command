import { FrontendConfig } from "@solaris-command/core/src/types/config";
import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
    const config: FrontendConfig = {
        baseUrl: process.env.FRONTEND_BASE_URL,
        socketUrl: process.env.FRONTEND_SOCKET_URL,
        googleClientId: process.env.GOOGLE_CLIENT_ID,
    };

    return res.json(config);
})

export default router;
