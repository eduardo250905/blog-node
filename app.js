// Carregando módulos
    import express from 'express';
    const app = express();
    import { engine } from 'express-handlebars';
    import mongoose, { mongo } from 'mongoose';
    import admin from './routes/admin.js';
    import usuario from './routes/usuario.js'
    import path, { join } from 'path';
    import { fileURLToPath } from 'url';
    import { dirname } from 'path';
    import session from 'express-session';
    import flash from 'express-flash';
    import Postagem from './models/Postagem.js';
    import Categoria from './models/Categoria.js';
    import passport from 'passport';
    import configurePassport from './config/auth.js';
    import db from './config/db.js';
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    import dotenv from 'dotenv'
    dotenv.config()
    
// Configurações
    // Sessão
        app.use(session({
            secret: process.env.SESSION_SECRET,
            resave: true,
            saveUninitialized: true
        }));
        app.use(passport.initialize())
        app.use(passport.session())
        configurePassport(passport);
        app.use(flash())
    // Middleware
        app.use((req, res, next) => {
            res.locals.success_msg = req.flash('success_msg');
            res.locals.error_msg = req.flash('error_msg');
            res.locals.error = req.flash('error');
            res.locals.user = req.user ? req.user.toObject() : null;
            next();
        })
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    // Handlebars
        app.engine('handlebars', engine());
        app.set('view engine', 'handlebars');
        app.set('views', './views');
    // Mongoose
        mongoose.Promise = global.Promise;
        mongoose.connect(db.mongoURI).then(() => {
            console.log('Conectado ao mongo!');
        }).catch((err) => {
            console.log(`Erro ${err}`);
        });
    //Public
        app.use(express.static(path.join(__dirname, 'public')));

// Rotas
    app.get('/', (req, res) =>{
        Postagem.find().lean().populate("categoria").sort({data: "desc"}).limit(3).then((postagens) => {
            res.render("index", {postagens: postagens})
        }).catch((err) => {
            console.log(`Erro na aplicação: ${err}`)
            req.flash("error_msg", "Houve um erro na aplicação")
            res.redirect('/404')
        })
    });

    app.get('/postagens', (req, res) => {
        Postagem.find().lean().populate("categoria").sort({ data: "desc" }).then((postagens) =>  {
            res.render("categoria/postagens", {postagens: postagens})
        }).catch((err) => {
            console.log(`Erro ao listar postagens: ${err}`)
            req.flash("error_msg", "Erro ao listar postagens")
            res.redirect('/')
        })
    })

    app.get('/postagens/:slug', (req, res) => {
        Postagem.findOne({ slug: req.params.slug }).lean().then((postagem) => {
            if(postagem){
                res.render('postagem/index', { postagem: postagem })
            }else{
                req.flash("error_msg", "Essa postagem não existe")
                res.redirect('/')
            }
        }).catch((err) => {
            console.log(`Erro ao mostrar postagem: ${err}`)
            req.flash("error_msg", "Erro ao mostrar postagem")
            res.redirect('/')
        })
    });

    app.get('/categorias', (req, res) => {
        Categoria.find().lean().then((categorias) => {
            res.render('categoria/index', { categorias: categorias })
        }).catch((err) => {
            console.log("Erro ao listar categorias")
            req.flash("error_msg", "Erro ao listar categorias")
            res.redirect('/')
        })
    });

    app.get('/categorias/:slug', (req, res) => {
        Categoria.findOne({ slug: req.params.slug }).lean().then((categoria) => {
            if(categoria){
                Postagem.find({ categoria: categoria._id }).lean().then((postagens) => {
                    res.render('categoria/postagens', { categoria, postagens })
                })
            }else{
                req.flash("error_msg", "Essa categoria não existe")
                res.redirect('/')
            }
        }).catch((err) => {
            req.flash("error_msg", "Erro ao listar postagens")
            res.redirect('/')
        })
    });

    app.get('/404', (req, res) => {
        res.send("Erro 404!")
    });

    app.use('/admin', admin);

    app.use('/usuario', usuario);
//Outros
const PORT = 8081;
app.listen(PORT, () => {
    console.log("Servidor rodando...");
});