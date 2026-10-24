import { PrismaClient } from '@prisma/client'
import express from 'express'

const port = 3000
const app = express()
const prisma = new PrismaClient()

app.use(express.json())

app.get('/movies', async (_, res) => {
    const movies = await prisma.movie.findMany({
        include: {
            movie_genres: {
                include: {
                    genres: true,
                },
            },
        },
        orderBy: {
            title: 'asc',
        },
    })
    res.json(movies)
})

app.post('/movies', async (req, res) => {
    const {
        title,
        sinopse,
        release_date,
        duration_minutes,
        rating,
        language,
        genre_id,
    } = req.body

    try {
        const movie = await prisma.movie.create({
            data: {
                title,
                sinopse,
                release_date: new Date(release_date),
                duration_minutes,
                rating,
                language,
                movie_genres: {
                    create: {
                        genre_id: 2,
                    },
                },
            },
        })

        res.status(201).json(movie)
    } catch (error) {
        return res.status(500).send({ message: 'Falha ao cadastrar um filme' })
    }
})

app.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`)
})
