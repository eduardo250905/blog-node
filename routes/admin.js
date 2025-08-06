import express from 'express';
const router = express.Router();
import Categoria from '../models/Categoria.js';
import Postagem from '../models/Postagem.js';
import eAdmin from '../helpers/eAdmin.js';

router.get('/', eAdmin, (req, res) => {
    res.render('admin/index');
});

router.get('/categorias', eAdmin, (req, res) => {
    Categoria.find().sort({data: "desc"}).lean().then((categorias) => {
        res.render('admin/categorias', { categorias })
    }).catch((err) => {
        console.log(`Erro ao listar categorias: ${err}`)
        req.flash("error_msg", "Houve um erro ao listar categorias");
        res.redirect("/admin")
    })
    
});

router.get('/categorias/add', eAdmin, (req, res) => {
    res.render('admin/addcategorias');
});

router.post('/categorias/nova', eAdmin, (req, res) => {
    let erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome inválido"})
    }
    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null || !/^[a-z\-]+$/.test(req.body.slug)){
        erros.push({texto: "Slug inválido"})
    }
    if(req.body.nome.length < 2){
        erros.push({texto: "Nome da categoria muito pequeno"})
    }

    if(erros.length > 0){
        res.render("admin/addcategorias", { erros })
    } else{
        const novaCategoria = new Categoria({
            nome: req.body.nome,
            slug: req.body.slug
        })

        novaCategoria.save().then(() => {
            req.flash("success_msg", "Categoria criada com sucesso!")
            res.redirect('/admin/categorias')
        }).catch((err) => {
            console.log(`Erro ao criar nova categoria: ${err}`)
            req.flash("error_msg", "Erro ao criar nova categoria")
            res.redirect("/admin")
        })
    }    
});

router.get('/categorias/edit/:id', eAdmin, (req, res) => {
    Categoria.findOne({ _id: req.params.id }).lean().then((categoria) => {
        res.render("admin/editcategorias", { categoria })
    }).catch((err) => {
        console.log(`Erro ao editar categoria: ${err}`)
        req.flash("error_msg", "Essa categoria não existe")
        res.redirect('/admin/categorias')
    })
});

router.post('/categorias/edit', eAdmin, (req, res) => {
    let erros = []

    if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
        erros.push({texto: "Nome inválido"})
    }
    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null || !/^[a-z\-]+$/.test(req.body.slug)){
        erros.push({texto: "Slug inválido"})
    }
    if(req.body.nome.length < 2){
        erros.push({texto: "Nome da categoria muito pequeno"})
    }

    if(erros.length > 0){
        res.render("admin/editcategorias", { erros })
    }else{
        Categoria.updateOne( {_id: req.body.id}, 
            { $set: { "nome": req.body.nome, "slug": req.body.slug }}, 
            { runValidators : true}).then(() => {
            req.flash("success_msg", "Categoria editada com sucesso")
            res.redirect('/admin/categorias')
        }).catch((err) => {
            console.log(`Erro ao editar categoria: ${err}`)
            req.flash("error_msg", "Erro ao editar categoria, tente novamente!")
            res.redirect('/admin/categorias')            
        })
    }
});

router.post('/categorias/deletar', eAdmin, (req, res) => {
    Categoria.deleteOne({ _id: req.body.id }).then(() => {
        req.flash("success_msg", "Categoria deletada com sucesso!")
        res.redirect('/admin/categorias')
    }).catch((err) => {
        console.log(`Erro ao deletar categoria: ${err}`)
        req.flash("error_msg", "Erro ao deletar categoria")
        res.redirect('/admin/categorias')
    })
});

router.get('/postagens', eAdmin, (req, res) => {
    Postagem.find().sort({ data:"desc" }).lean().populate("categoria").then((postagem) => {
        res.render("admin/postagens", { postagem: postagem })
    }).catch((err) => {
        console.log(`Erro ao listar postagens: ${err}`)
        req.flash("error_msg", "Erro ao listar as postagens")
        res.redirect('/admin')
    })
});

router.get('/postagens/add', eAdmin, (req, res) => {
    Categoria.find().lean().then((categorias) => {
        res.render("admin/addpostagens", {categorias: categorias});
    }).catch((err) => {
        console.log(`Erro ao carregar o formulário: ${err}`)
        req.flash("error_msg", "Erro ao carregar o formulário")
        res.redirect('/admin/postagens')
    })
});

router.post('/postagens/nova', eAdmin, (req, res) => {
    let erros = []

    if(!req.body.titulo || typeof req.body.titulo == undefined || req.body.titulo == null){
        erros.push({texto: "Título inválido"})
    }
    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null || !/^[a-z\-]+$/.test(req.body.slug)){
        erros.push({texto: "Slug inválido"})
    }
    if(!req.body.descricao || typeof req.body.descricao == undefined || req.body.descricao == null){
        erros.push({texto: "Descrição inválida"})
    }
    if(!req.body.conteudo || typeof req.body.conteudo == undefined || req.body.conteudo == null){
        erros.push({texto: "Conteúdo inválido"})
    }
    if(req.body.titulo.length < 2){
        erros.push({texto: "Título da categoria muito pequeno"})
    }
    if(req.body.categoria == "0"){
        erros.push({texto: "Categoria inválida, registre uma categoria"})
    }

    if(erros.length > 0){
        Categoria.find().lean().then((categorias) => {
            res.render("admin/addpostagens", {erros: erros, categorias: categorias});
        }).catch((err) => {
            console.log(`Erro ao carregar o formulário: ${err}`)
            req.flash("error_msg", "Erro ao carregar o formulário")
            res.redirect('/admin/postagens')
        })
    } else{
        const novaPostagem = new Postagem({
            titulo: req.body.titulo,
            slug: req.body.slug,
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria
        })

        novaPostagem.save().then(() => {
            req.flash("success_msg", "Postagem criada com sucesso!")
            res.redirect('/admin/postagens')
        }).catch((err) => {
            console.log(`Erro ao criar nova postagem ${err}`)
            req.flash("error_msg", "Erro ao criar nova postagem")
            res.redirect('/admin/postagens')
        })
    }

});

router.get('/postagens/edit/:id', eAdmin, (req, res) => {
    Postagem.findOne({ _id: req.params.id }).lean().then((postagem) => {
        Categoria.find().lean().then((categorias) => {
            res.render('admin/editpostagens', { postagem: postagem, categorias: categorias })
        }).catch((err) => {
            console.log(`Erro ao procurar categorias: ${err}`)
            req.flash("error_msg", "Erro ao procurar categorias")
            res.redirect("/admin/postagens")
        })
    }).catch((err) => {
        console.log(`Erro ao buscar postagem para edição: ${err}`)
        req.flash("error_msg", "Erro ao buscar postagem para edição")
        res.redirect("/admin/postagens")
    })
});

router.post('/postagens/edit', eAdmin, (req, res) => {
    let erros = []

    if(!req.body.titulo || typeof req.body.titulo == undefined || req.body.titulo == null){
        erros.push({texto: "Título inválido"})
    }
    if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null || !/^[a-z\-]+$/.test(req.body.slug)){
        erros.push({texto: "Slug inválido"})
    }
    if(!req.body.descricao || typeof req.body.descricao == undefined || req.body.descricao == null){
        erros.push({texto: "Descrição inválida"})
    }
    if(!req.body.conteudo || typeof req.body.conteudo == undefined || req.body.conteudo == null){
        erros.push({texto: "Conteúdo inválido"})
    }
    if(req.body.titulo.length < 2){
        erros.push({texto: "Título da categoria muito pequeno"})
    }
    if(req.body.categoria == "0"){
        erros.push({texto: "Categoria inválida, registre uma categoria"})
    }

    if(erros.length > 0){
        Postagem.findOne({ _id: req.body.id }).lean().then((postagem) => {
            Categoria.find().lean().then((categorias) => {
                res.render('admin/editpostagens', { erros: erros, postagem: postagem, categorias: categorias })
            }).catch((err) => {
                console.log(`Erro ao procurar categorias: ${err}`)
                req.flash("error_msg", "Erro ao procurar categorias")
                res.redirect("/admin/postagens")
            })
        }).catch((err) => {
        console.log(`Erro ao buscar postagem para edição: ${err}`)
        req.flash("error_msg", "Erro ao buscar postagem para edição")
        res.redirect("/admin/postagens")
        })
    }else{
        Postagem.updateOne( { _id: req.body.id }, { 
            $set: {
                "titulo" : req.body.titulo,
                "slug" : req.body.slug,
                "descricao" : req.body.descricao,
                "conteudo" : req.body.conteudo,
                "categoria" : req.body.categoria
            }
        },
        { 
            runValidators: true 
        }).then(() => {
                req.flash("success_msg", "Postagem editada com sucesso!")
                res.redirect('/admin/postagens')
        }).catch((err) => {
                console.log(`Erro ao editar postagem: ${err}`)
                req.flash("error_msg", "Erro ao editar postagem")
                res.redirect('/admin/postagens')
        })
    }
})

router.post('/postagens/deletar', eAdmin, (req, res) => {
    Postagem.deleteOne({_id: req.body.id }).then(() => {
        req.flash("success_msg", "categoria deletada com sucesso")
        res.redirect('/admin/postagens')
    }).catch((err) => {
        console.log(`Erro ao deletar categoria: ${err}`)
        req.flash("error_msg", "Erro ao deletar categoria")
        res.redirect('/admin/postagens')
    })
});

export default router;