import express from 'express'

const port = 3000
const app = express()

app.get('/movies', (req, res) => {
    res.send('Movies Page')
})

app.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`)
})
