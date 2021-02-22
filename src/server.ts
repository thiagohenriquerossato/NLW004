import express, { request, response } from "express";

const app = express();

app.get("/users", (request, response) => {
    return response.send("Hello world!")
})

app.post("/", (request, response) =>{
    return response.json({message:"Dados salvos com sucesso!"})
})
app.listen(3333, () => console.log("Server is running!"));
