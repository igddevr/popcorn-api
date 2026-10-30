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
    const { title, sinopse, release_date, duration_minutes, rating, language } =
        req.body

    try {
        const movieNotUnique = await prisma.movie.findFirst({
            where: {
                title: { equals: title, mode: 'insensitive' },
            },
        })

        if (movieNotUnique) {
            res.status(409).send({
                message: 'Já existe um filme cadastrado com esse título',
            })
        }

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

app.put('/movies/:id', async (req, res) => {
    const id = Number(req.params.id)
    const movieExists = await prisma.movie.findUnique({
        where: {
            id,
        },
    })

    try {
        if (!movieExists) {
            return res.status(404).send({ message: 'Filme não encontrado' })
        }

        const data = { ...req.body }
        data.release_date = data.release_date
            ? new Date(data.release_date)
            : undefined

        const { genre_id, ...movieData } = data

        const movie = await prisma.movie.update({
            where: {
                id,
            },
            data: {
                ...movieData,
                movie_genres: {
                    deleteMany: {}, //exclui todos os gêneros associados ao filme antes de adicionar o novo gênero
                    create: {
                        genre_id,
                    },
                },
            },
        })

        res.status(200).json(movie)
    } catch (error) {
        return res.status(500).send({ message: 'Falha ao atualizar o filme' })
    }
})

app.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`)
})
