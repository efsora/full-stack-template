import express, { RequestHandler } from "express";
import { middleware } from "#middlewares/middlewares";
const app = express();
const port = process.env.PORT ?? 9001;

app.get("/", middleware as RequestHandler, (req, res) => {
    const requestBody = req.body as { message: string };
    console.log("Request body:", requestBody);

    res.send("Hello Efsora");
    console.log("Response sent");
});

app.listen(port, () => {
    console.log(`Server is running on port ${String(port)}`);
});

export default app;