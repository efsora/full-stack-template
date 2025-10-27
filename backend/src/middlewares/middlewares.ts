import { RequestHandler } from "express";

export const middleware: RequestHandler = ( req, res ) => {
    console.log("Request received");
    console.log("Request body:", req.body);
    res.send("Hello Efsora! from middleware");
    console.log("Response sent");
};