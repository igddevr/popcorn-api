"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_json_1 = __importDefault(require("../swagger.json"));
const port = 3000;
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
app.use(express_1.default.json());
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_json_1.default));
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
    });
    res.status(200).json(movies);
});
app.post('/movies', async (req, res) => {
    const { title, sinopse, release_date, duration_minutes, rating, language } = req.body;
    try {
        const movieNotUnique = await prisma.movie.findFirst({
            where: {
                title: { equals: title, mode: 'insensitive' },
            },
        });
        if (movieNotUnique) {
            res.status(409).send({
                message: 'Já existe um filme cadastrado com esse título',
            });
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
        });
        res.status(201).json(movie);
    }
    catch (error) {
        return res.status(500).send({ message: 'Falha ao cadastrar um filme' });
    }
});
app.put('/movies/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).send({
            message: 'ID inválido',
        });
    }
    const movieExists = await prisma.movie.findUnique({
        where: {
            id,
        },
    });
    try {
        if (!movieExists) {
            return res.status(404).send({ message: 'Filme não encontrado' });
        }
        const data = { ...req.body };
        data.release_date = data.release_date
            ? new Date(data.release_date)
            : undefined;
        const { genre_id, ...movieData } = data;
        const movie = await prisma.movie.update({
            where: {
                id,
            },
            data: {
                ...movieData,
                ...(genre_id !== undefined && {
                    movie_genres: {
                        deleteMany: {},
                        create: {
                            genre_id: Number(genre_id),
                        },
                    },
                }),
            },
            include: {
                movie_genres: {
                    include: {
                        genres: true,
                    },
                },
            },
        });
        res.status(200).json(movie);
    }
    catch (error) {
        return res
            .status(500)
            .send({ message: 'Falha ao atualizar o filme', error });
    }
});
app.delete('/movies/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        const movieExists = await prisma.movie.findUnique({ where: { id } });
        if (!movieExists) {
            return res.status(404).send({ message: 'Filme não encontrado' });
        }
        await prisma.movie_genre.deleteMany({
            where: {
                movie_id: id,
            },
        });
        const movie = await prisma.movie.delete({
            where: {
                id: id,
            },
        });
        res.status(200).send({
            message: `Filme ${movie.title} deletado com sucesso`,
        });
    }
    catch (error) {
        return res.status(500).send({ message: 'Falha ao deletar o filme' });
    }
});
app.get('/genres/:name', async (req, res) => {
    const genreName = req.params.name;
    try {
        const genreExists = await prisma.genre.findMany({
            where: {
                name: {
                    equals: genreName,
                    mode: 'insensitive',
                },
            },
        });
        if (!genreExists.length) {
            return res.status(404).send({ message: 'Gênero não encontrado' });
        }
        const movies = await prisma.movie.findMany({
            where: {
                movie_genres: {
                    some: {
                        genres: {
                            name: {
                                equals: genreName,
                                mode: 'insensitive',
                            },
                        },
                    },
                },
            },
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
        });
        res.status(200).json(movies);
    }
    catch (error) {
        return res
            .status(500)
            .send({ message: 'Falha ao buscar filmes por gênero' });
    }
});
app.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`);
});
//# sourceMappingURL=server.js.map