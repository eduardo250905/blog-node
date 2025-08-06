import express from "express";
const router = express.Router();
import Usuario from "../models/Usuario.js";
import bcrypt from "bcryptjs";
import passport from "passport";
const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.get('/registro', (req, res) => {
    res.render('usuario/registro')
});

router.post('/registro', (req, res) => {
    let erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({ texto: "Nome inválido" })
    }
    if(!req.body.email || typeof req.body.email == undefined || req.body.email == null || !regexEmail.test(req.body.email)){
        erros.push({ texto: "E-mail inválido" })
    }
    if(!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null){
        erros.push({ texto: "Senha inválida" })
    }
    if(req.body.senha.length < 5){
        erros.push({ texto: "Senha muito curta" })
    }
    if(req.body.senha != req.body.senha2){
        erros.push({ texto: "As senhas são diferentes" })
    }

    if(erros.length > 0){
        res.render('usuario/registro', { erros: erros })
    }else{
        Usuario.findOne({ email: req.body.email }).lean().then((usuario) => {
            if(usuario){
                req.flash("error_msg", "Esse usuário já existe")
                res.redirect('/usuario/registro')
            }else{
                const novoUsuario = new Usuario({
                    nome: req.body.nome,
                    email: req.body.email,
                    senha: req.body.senha
                })

                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(novoUsuario.senha, salt, (err, hash) => {
                        if(err){
                            console.log(`Erro ao salvar usuário: ${err}`)
                            req.flash("error_msg", "Erro durante o salvamento do usuário")
                            res.redirect('/')
                        }

                        novoUsuario.senha = hash

                        novoUsuario.save().then(() => {
                            passport.authenticate("local", {
                                successRedirect: '/',
                                failureRedirect: '/usuario/login',
                                failureFlash: true
                            })(req, res)
                        }).catch((err) => {
                            console.log(`Erro ao criar usuário: ${err}`)
                            req.flash("error_msg", "Erro ao criar usuário")
                            res.redirect('/usuario/registro')
                        })
                    })
                })
            }
        }).catch((err) => {
            console.log(`Erro ao registrar usuário: ${err}`)
            req.flash("error_msg", "Erro ao registrar usuario")
            res.redirect('/')
        })
    }
});

router.get('/login', (req, res) => {
    if(req.user){
        req.flash("error_msg", "Você já está logado")
        res.redirect('/')
    }
    res.render('usuario/login')
});

router.post('/login', (req, res, next) => {
    passport.authenticate("local", {
        successRedirect: '/',
        failureRedirect: '/usuario/login',
        failureFlash: true
    })(req, res, next)
});

router.get('/logout', (req, res) => {
    req.logout(() => {
        req.flash("success_msg", "Deslogado com sucesso!")
        res.redirect('/')
    })
});

router.post('/deletar', (req, res) => {
    if(req.user){
        Usuario.deleteOne({ _id: req.user._id  }).then(() => {
            req.flash("success_msg", "Usuário deletado com sucesso")
            res.redirect('/')
        }).catch((err) => {
            console.log(`Erro ao deletar usuário: ${err}`)
            req.flash("error_msg", "Erro ao deletar usuário")
            res.redirect('/')
        })
    }else{
        req.flash("error_msg", "Você não está logado")
        res.redirect('/')
    }
});

router.get('/editar', (req, res) => {
    if(req.user){
        res.render("usuario/editar")
    }
});

router.post('/editar', (req, res) => {
    let erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({ texto: "Nome inválido" })
    }
    if(!req.body.email || typeof req.body.email == undefined || req.body.email == null || !regexEmail.test(req.body.email)){
        erros.push({ texto: "E-mail inválido" })
    }
    if(!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null){
        erros.push({ texto: "Senha incorreta"})
    }
    bcrypt.compare(req.body.senha, req.user.senha, (err, result) => {
        if(result == false){
            erros.push({ texto: "Senha incorreta" })
        }
    })
    
    if(erros.length > 0){
        res.render("usuario/editar", {erros: erros})
    }else{
        Usuario.updateOne({ _id: req.user._id }, {$set: {"nome": req.body.nome, "email": req.body.email}}, {runValidators: true}).then(() => {
            req.flash("success_msg", "Usuário editado com sucesso")
            res.redirect('/')
        }).catch((err) => {
            console.log(`Erro ao editar usuário: ${err}`)
            req.flash("error_msg", "Erro ao editar usuário")
            res.redirect('/')
        })
    }
});

export default router;