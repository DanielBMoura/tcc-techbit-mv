// Chama as instalações
    const express = require('express')
    const router = express.Router()
    const multer = require('multer')
    const path = require('path')
    const fs = require('fs')
    const {eAdmin} = require('../helpers/eAdmin')
    const { Op, where, col, fn, literal } = require("sequelize")
    const nodemailer = require('nodemailer')

    const Produto = require('../models/Produto')
    const SubCategoria = require('../models/SubCategoria')
    const Categoria = require('../models/Categoria')
    const CategoriaBlog = require('../models/CategoriaBlog')
    const PostagemBlog = require('../models/PostagemBlog')
    const Orcamento = require('../models/Orcamento')
    const ItensOrcamento = require('../models/ItensOrcamento')
    const Usuario = require('../models/Usuario')
    const Endereco = require('../models/Endereco')
    const Pedido = require('../models/Pedido')
    const ItensPedido = require('../models/ItensPedido')
    const NewsletterUsuario = require('../models/NewsletterUsuario')
    const NewsletterEmail = require('../models/NewsletterEmail')

// Configurações
    // Multer
        const storage = multer.memoryStorage()
        const upload = multer({ storage })

// Rotas

    router.post('/buscar', eAdmin, async (req, res) => {
        console.log('Eu sou o buscarAdmin')
    })

    router.get('/', eAdmin, async (req, res) => {
        
        const totalPedidos = await Pedido.count()

        const produtosEntregues = await Pedido.count({
            where: { status_pedido: 'Entregue' }
        })

        const somaValores = await Pedido.sum('valor_total_pedido', {
            where: {
                status_pedido: {
                    [Op.or]: [
                        'Em separação', 
                        'Aguardando envio', 
                        'Enviado', 
                        'Em rota de entrega', 
                        'Entregue', 
                        'Entrega não realizada'
                    ]
                }
            }
        })

        const AnoAtual = new Date().getFullYear()
        const ganhosPorMes = []

        for(let month = 0; month < 12; month++){
            const dataInicio = new Date(AnoAtual, month, 1)
            const dataFinal = new Date(AnoAtual, month + 1, 0)

            const total = await Pedido.sum('valor_total_pedido', {
                where: {
                    data_pedido: {
                        [Op.between]: [dataInicio, dataFinal]
                    },
                    status_pedido: {
                        [Op.or]: [
                            'Em separação', 
                            'Aguardando envio', 
                            'Enviado', 
                            'Em rota de entrega', 
                            'Entregue', 
                            'Entrega não realizada'
                        ]
                    }
                }
            })

            ganhosPorMes.push(total || 0)
        }

        const produtosMaisVendidos = await ItensPedido.findAll({
            attributes: [
                [col('produtos.nome_produto'), 'nome_produto'],
                [fn('SUM', col('itenspedidos.quantidade_itemPedido')), 'total_vendido']
            ],
            include: [{
                model: Produto,
                as: 'produtos',
                attributes: []
            }],
            group: ['produtos.nome_produto'],
            order: [[literal('total_vendido'), 'DESC']],
            raw: true
        })

        let labels = produtosMaisVendidos.map(item => item.nome_produto)
        let dados = produtosMaisVendidos.map(item => item.total_vendido)

        if (labels.length > 5) {
            labels = labels.slice(0, 4)
            dados = dados.slice(0, 4)
            
            const outrosTotal = dados.slice(4).reduce((a, b) => a + parseInt(b), 0)

            labels.push('Outros')
            dados.push(outrosTotal)
        }

        res.render('admin/index', {
            totalPedidos, 
            produtosEntregues, 
            somaValores, 
            dadosGrafico: {
                meses: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                valores: ganhosPorMes
            },
            produtosMaisVendidos: {
                labels: labels,
                dados: dados
            }
        })
    })

    router.get('/Usuarios', eAdmin, async (req, res) => {
        
        const totalUsuarios = await Usuario.count()

        const todosUsuarios = await Usuario.findAll()
        
        res.render('admin/usuarios/usuarios', { totalUsuarios, todosUsuarios })
    })

    router.get('/Usuarios/Criar', eAdmin, async (req, res) => {
        res.render('admin/usuarios/criarUsuarios')
    })

    router.get('/Usuarios/:id', eAdmin, async (req, res) => {

        const { id } = req.params

        const usuario = await Usuario.findOne({
            where: { id_usuario:  id}
        })

        const endereco = await Endereco.findOne({
            where: { id_endereco: usuario.id_endereco }
        })

        const telefoneSemFormatar = usuario.telefone_usuario
        let telefoneFormatado = null

        if (telefoneSemFormatar.length === 11) {
            telefoneFormatado = `(${telefoneSemFormatar.substring(0, 2)}) ${telefoneSemFormatar.substring(2, 7)}-${telefoneSemFormatar.substring(7)}`
        }
        
        if (telefoneSemFormatar.length === 10) {
            telefoneFormatado = `(${telefoneSemFormatar.substring(0, 2)}) ${telefoneSemFormatar.substring(2, 6)}-${telefoneSemFormatar.substring(6)}`;
        }

        let cepSemFormatacao = endereco.cep
        let cepFormatado = null

        if (cepSemFormatacao.length === 8) {
            cepFormatado = cepSemFormatacao.substring(0, 5) + '-' + cepSemFormatacao.substring(5)
        }

        res.render('admin/usuarios/usuarioIndividual', { usuario, endereco, telefoneFormatado, cepFormatado })

    })

    router.get('/Categorias', eAdmin, async(req, res) => {
        const categorias = await Categoria.findAll()
        res.render('admin/categorias/categorias', {categorias})
    })

    router.get('/Categorias/Adicionar', eAdmin, async(req, res) => {
        res.render('admin/categorias/addcategorias')
    })

    router.post('/Categorias/Novo', eAdmin, upload.single('imagem'), async(req, res) => {
        let { nome, slug } = req.body

        const imagem = req.file

        // ----------------------------------------------------------------------------------

        let erros = []

        const caracteresInvalidos = [    
            '!', '#', '$', '%', '*', '+', ';', '<', '=', '>', '?', '@', '[',
            '\\', ']', '^', '_', '`', '{', '|', '}', '~', '´', '¨', '¿', '¡', '\n', '\r', '\t'
        ]

        const regexNome = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s]+$/
        const categoriaExistente = await Categoria.findOne({ where: { nome_categoria: nome } })

        const regexSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        const slugExistente = await Categoria.findOne({ where: { slug_categoria: slug } })

        // ----------------------------------------------------------------------------------

        for (let i = 0; i < nome.length; i++) {
            if (caracteresInvalidos.includes(nome[i])) {
                erros.push({mensagem: 'Nome inválido - Possui caracteres inválidos'})
            }
        }

        if (!nome.trim()) {
            erros.push({mensagem: 'Nome inválido - Não pode conter apenas espaços'});
        }

        if (!regexNome.test(nome)) {
            erros.push({mensagem: 'Nome inválido - Apenas caracteres alfanuméricos são permitidos'});
        }

        if (!isNaN(nome)) {
            erros.push({mensagem: 'Nome inválido - Não pode ser apenas números'});
        }

        if (categoriaExistente) {
            erros.push({mensagem: 'Nome inválido - Já existe uma categoria cadastrado com esse nome'})
        }

        if (nome.length < 4) {
            erros.push({mensagem: 'Nome da categoria inválido - Número de caracteres insuficientes'})
        }

        if (nome.length > 100) {
            erros.push({mensagem: 'Nome da categoria inválido - Atingiu o número máximo de caracteres máximo'})
        }

        if (slug.length < 3 || slug.length > 50) {
            erros.push({mensagem: 'Slug inválido - Deve conter entre 3 e 50 caracteres'});
        }

        if (!regexSlug.test(slug)) {
            erros.push({mensagem: 'Slug inválido - Não possui o formato comum de um slug'})
        }

        if (slugExistente) {
            erros.push({mensagem: 'Slug inválido - Já existe uma categoria cadastrada com esse slug'})
        }

        if (req.file == undefined) {
            erros.push({mensagem: 'Carregue uma imagem para a categoria'})
        }

        // ------------------------------------------------------------------------------------------

        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {
            const nomeImagem = nome.replace(/\s+/g, '-').toLowerCase() + path.extname(imagem.originalname)

            const uploadPath = path.join(__dirname, '..', 'public', 'imgs', nomeImagem)

            fs.writeFile(uploadPath, imagem.buffer, async (err) => {
                if (err) {
                    res.status(400).json({ mensagem: 'Erro ao salvar a imagem.' })
                } else {
                    const novaCategoria = await Categoria.create({
                        nome_categoria: nome,
                        slug_categoria: slug,
                        imagem_categoria: '/imgs/' + nomeImagem,
                    })

                    res.status(200).json({ mensagem: 'Categoria criada com sucesso', redirect: '/Admin/Categorias/Adicionar' })
                }
            })
        }
    })

    router.get('/Categorias/:slug', eAdmin, async(req, res) => {
        const editarCategoria = await Categoria.findOne({where: { slug_categoria: req.params.slug}})
        res.render('admin/categorias/editcategorias', { editarCategoria })
    })

    router.post('/Categorias/Editar', eAdmin, upload.single('imagem'), async(req, res) => {
        let { id, nome, slug } = req.body

        let caminhoImagemAntiga = req.body.imagem_antiga
        let novaImagem = req.file

        const caminhoAntigo = path.join(__dirname, '..', 'public', caminhoImagemAntiga)

        const categoriaAntiga = await Categoria.findOne({ where: { id_categoria: id } })

        const regexSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        const slugExistente = await Categoria.findOne({ where: { slug_categoria: slug, id_categoria: { [Op.ne]: id } } })
       
        const nomeExistente = await Categoria.findOne({ where: { nome_categoria: nome, id_categoria: { [Op.ne]: id } } })
        const regexNome = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s]+$/

        let erros = []

        const caracteresInvalidos = [    
            '!', '#', '$', '%', '*', '+', ';', '<', '=', '>', '?', '@', '[',
            '\\', ']', '^', '_', '`', '{', '|', '}', '~', '´', '¨', '¿', '¡', '\n', '\r', '\t'
        ]

        // ------------------------------------------------------------------------------------

        for (let i = 0; i < nome.length; i++) {
            if (caracteresInvalidos.includes(nome[i])) {
                erros.push({mensagem: 'Nome inválido - Possui caracteres inválidos'})
            }
        }

        if (!nome.trim()) {
            erros.push({mensagem: 'Nome inválido - Não pode conter apenas espaços'});
        }

        if (!regexNome.test(nome)) {
            erros.push({mensagem: 'Nome inválido - Apenas caracteres alfanuméricos são permitidos'});
        }

        if (!isNaN(nome)) {
            erros.push({mensagem: 'Nome inválido - Não pode ser apenas números'});
        }

        if (nome.length < 4) {
            erros.push({mensagem: 'Nome da categoria inválido - Número de caracteres insuficientes'})
        }

        if (nome.length > 100) {
            erros.push({mensagem: 'Nome da categoria inválido - Atingiu o número máximo de caracteres máximo'})
        }

        if (nomeExistente) {
            erros.push({mensagem: 'Nome inválido - Já existe uma categoria cadastrada com esse nome'})
        }

        if (slug.length < 3 || slug.length > 50) {
            erros.push({mensagem: 'Slug inválido - Deve conter entre 3 e 50 caracteres'});
        }

        if (!slug.trim()) {
            erros.push({mensagem: 'Slug inválido - Não pode conter apenas espaços'});
        }

        if (!regexSlug.test(slug)) {
            erros.push({mensagem: 'Slug inválido - Não possui o formato comum de um slug'})
        }

        if (slugExistente) {
            erros.push({mensagem: 'Slug inválido - Já existe uma categoria cadastrada com esse slug'})
        }

        // ------------------------------------------------------------------------------------

        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {
            if (novaImagem) {
                if (fs.existsSync(caminhoAntigo)) {
                    fs.unlink(caminhoAntigo, (err) => {
                        if (err) {
                            console.log('Erro ao deletar a imagem antiga:', err)
                        }
                    })
                }
    
                const nomeImagem = nome.replace(/\s+/g, '-').toLowerCase() + path.extname(novaImagem.originalname)
    
                const uploadPath = path.join(__dirname, '..', 'public', 'imgs', nomeImagem)
                                    
                fs.writeFile(uploadPath, novaImagem.buffer, async (err) => {
                    if (err) {
                        res.status(400).json({ mensagem: 'Erro ao salvar a imagem.' })
                        console.log('O erro é:' + err)
                    } else {
                        const novaCategoria = await Categoria.update({
                            nome_categoria: nome,
                            slug_categoria: slug,
                            imagem_categoria: '/imgs/' + nomeImagem
                        }, { where: { id_categoria: id } })
    
                        res.status(200).json({ mensagem: 'Categoria editada com sucesso', redirect: '/Admin/Categorias' })
                    }
                })
    
            } else {
                if (categoriaAntiga.nome_categoria == nome &&
                    categoriaAntiga.slug_categoria == slug
                ) {
                    erros.push({mensagem: 'Categoria igual - Se quiser editar, altere algo'})
                    res.status(400).json(erros[0])
                } else {
                    
                    const extensao = path.extname(caminhoImagemAntiga)
    
                    const nomeImagem = nome.replace(/\s+/g, '-').toLowerCase() + extensao
    
                    const caminhoNovo = path.join(__dirname, '..', 'public', 'imgs', nomeImagem)
    
                    fs.rename(caminhoAntigo, caminhoNovo, async () => {
                        const novaCategoria = await Categoria.update({
                            nome_categoria: nome,
                            slug_categoria: slug,
                            imagem_categoria: '/imgs/' + nomeImagem
                        }, { where: { id_categoria: id } })
                
                        res.status(200).json({ mensagem: 'Categoria editada com sucesso', redirect: '/Admin/Categorias' })
                    })
                }
            }
        }
    })

    router.post('/Categorias/Deletar', eAdmin, async (req, res) => {
        // Processo para deletar categoria:
        let { id } = req.body

        const categoria = await Categoria.findOne({ where: { id_categoria: id } })
        const imagemCategoria = path.join(__dirname, '..', 'public', categoria.imagem_categoria)

        await fs.promises.unlink(imagemCategoria)

        //  Buscar todas as subcategorias relacionadas à categoria
        const subCategoria = await SubCategoria.findAll({ where: { id_categoria: id} })

        for(const sub of subCategoria){

            // Buscar e excluir todos os produtos da subcategoria
            const produto = await Produto.findAll({ where: { id_subCategoria: sub.id_subCategoria } })

            for(const produtoIndividual of produto){
                const imagensProdutos = JSON.parse(produtoIndividual.imagens_produto)

                for (const imagem of imagensProdutos) {
                    const caminhoImagem  = path.join(__dirname, '..', 'public', imagem)
                    await fs.promises.unlink(caminhoImagem )
                }

               const produtoDeletado = await Produto.destroy({where: { id_produto: produtoIndividual.id_produto } })
            }

            const imagemSubCategoria = path.join(__dirname, '..', 'public', sub.imagem_subCategoria)
            await fs.promises.unlink(imagemSubCategoria)

            const SubCategoriaDeletada = await SubCategoria.destroy({where: { id_subCategoria: sub.id_subCategoria } })
        }

        const categoriaDeletada = await Categoria.destroy({where: { id_categoria: id }}).then(() => {
            res.status(200).json({ mensagem: 'Categoria deletada com sucesso', redirect: '/Admin/Categorias' })
        })
    })

    router.get('/SubCategorias', eAdmin, async(req, res) => {
        const categorias = await Categoria.findAll()
        res.render('admin/subcategorias/categoriaSub', {categorias})
    })

    router.get('/SubCategorias/Adicionar', eAdmin, async(req, res) => {
        const categoria = await Categoria.findAll()
        res.render('admin/subcategorias/addSubCategoria', {categoria})
    })

    router.post('/SubCategorias/Novo', eAdmin, upload.single('imagem'), async(req, res) => {

        let { id, nome, slug } = req.body
        const categoria = await Categoria.findOne({where: {id_categoria: id}})

        // -------------------------------------------------------------------------------------

        let erros = []

        const caracteresInvalidos = [    
            '!', '#', '$', '%', '*', '+', ';', '<', '=', '>', '?', '@', '[',
            '\\', ']', '^', '_', '`', '{', '|', '}', '~', '´', '¨', '¿', '¡', '\n', '\r', '\t'
        ]
        
        const regexNome = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s]+$/
        const subCategoriaExistente = await SubCategoria.findOne({ where: { nome_subCategoria: nome, id_categoria: id } })

        const regexSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        const slugExistente = await SubCategoria.findOne({ where: { slug_subCategoria: slug, id_categoria: id } })

        // -------------------------------------------------------------------------------------

        for (let i = 0; i < nome.length; i++) {
            if (caracteresInvalidos.includes(nome[i])) {
                erros.push({mensagem: 'Nome inválido - Possui caracteres inválidos'})
            }
        }

        if (!nome.trim()) {
            erros.push({mensagem: 'Nome inválido - Não pode conter apenas espaços'});
        }

        if (!regexNome.test(nome)) {
            erros.push({mensagem: 'Nome inválido - Apenas caracteres alfanuméricos são permitidos'});
        }

        if (!isNaN(nome)) {
            erros.push({mensagem: 'Nome inválido - Não pode ser apenas números'})
        }

        if (subCategoriaExistente) {
            erros.push({mensagem: 'Nome inválido - Já existe uma subCategoria cadastrada com esse nome'})
        }

        if (nome.length < 4) {
            erros.push({mensagem: 'Nome da subCategoria inválido - Número de caracteres insuficientes'})
        }

        if (nome.length > 100) {
            erros.push({mensagem: 'Nome da subCategoria inválido - Atingiu o número máximo de caracteres'})
        }

        if (!regexSlug.test(slug)) {
            erros.push({mensagem: 'Slug inválido - Não possui o formato comum de um slug'})
        }

        if (slug.length < 3 || slug.length > 100) {
            erros.push({mensagem: 'Slug inválido - Deve conter entre 3 e 100 caracteres'});
        }

        if (slugExistente) {
            erros.push({mensagem: 'Slug inválido - Já existe uma subCategoria cadastrada com esse slug'})
        }
        
        if (req.file == undefined) {
            erros.push({mensagem: 'Carregue uma imagem para a subCategoria'})
        }

        // -------------------------------------------------------------------------------------

        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {
            const imagem = req.file
            
            const nomeImagem = nome.replace(/\s+/g, '-').toLowerCase() + categoria.nome_categoria.replace(/\s+/g, '-').toLowerCase() + path.extname(imagem.originalname)
    
            const uploadPath = path.join(__dirname, '..', 'public', 'imgs', nomeImagem)
    
            fs.writeFile(uploadPath, imagem.buffer, async (err) => {
                if (err) {
                    res.status(400).json({ mensagem: 'Erro ao salvar a imagem.' })
                } else {
                    const novaSubCategoria = await SubCategoria.create({
                        nome_subCategoria: nome,
                        slug_subCategoria: slug,
                        imagem_subCategoria: '/imgs/' + nomeImagem,
                        id_categoria: id 
                    })
    
                    res.status(200).json({ mensagem: 'SubCategoria criada com sucesso', redirect: `/Admin/SubCategorias/Adicionar`})
                }
            })
        }
    })

    router.get('/SubCategorias/:slug', eAdmin, async(req, res) => {
        const slug = req.params.slug
        const categoria = await Categoria.findOne({where:{slug_categoria: slug}})

        if (categoria) {
            const subcategorias = await SubCategoria.findAll({where:{id_categoria: categoria.id_categoria}})
            if (subcategorias) {
                res.render('admin/subcategorias/subcategorias', {categoria, subcategorias})
            }
        } 
    })

    router.get('/SubCategorias/:slugCategoria/:slugSubCategoria', eAdmin, async(req, res) => {
        const categoria = await Categoria.findOne({where:{slug_categoria: req.params.slugCategoria}})
        const categorias = await Categoria.findAll({where: {id_categoria: { [Op.ne]: categoria.id_categoria}}})
        const subCategoria = await SubCategoria.findOne({where: {slug_subCategoria: req.params.slugSubCategoria, id_categoria: categoria.id_categoria}})
        res.render('admin/subcategorias/editSubCategoria', {subCategoria, categoria, categorias})
    })

    router.post('/SubCategoria/Editar', eAdmin, upload.single('imagem'), async(req, res) => {
        let { id, idCategoria, nome, slug } = req.body

        let categoria = await Categoria.findOne({where: {id_categoria: idCategoria}})

        let caminhoImagemAntiga = req.body.imagem_antiga
        let novaImagem = req.file

        const caminhoAntigo = path.join(__dirname, '..', 'public', caminhoImagemAntiga)

        const subCategoriaAntiga = await SubCategoria.findOne({ where: { id_subCategoria: id } })

        const regexSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        const slugExistente = await SubCategoria.findOne({ where: { slug_subCategoria: slug, id_subCategoria: { [Op.ne]: id}, id_categoria: idCategoria } })

        const regexNome = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s]+$/
        const subCategoriaExistente = await SubCategoria.findOne({ where: { nome_subCategoria: nome, id_subCategoria: { [Op.ne]: id }, id_categoria: idCategoria  } })

        // -------------------------------------------------------------------------------------

        let erros = []

        const caracteresInvalidos = [    
            '!', '#', '$', '%', '*', '+', ';', '<', '=', '>', '?', '@', '[',
            '\\', ']', '^', '_', '`', '{', '|', '}', '~', '´', '¨', '¿', '¡', '\n', '\r', '\t'
        ]

        // ------------------------------------------------------------------------------------

        for (let i = 0; i < nome.length; i++) {
            if (caracteresInvalidos.includes(nome[i])) {
                erros.push({mensagem: 'Nome inválido - Possui caracteres inválidos'})
            }
        }

        if (!nome.trim()) {
            erros.push({mensagem: 'Nome inválido - Não pode conter apenas espaços'})
        }

        if (!regexNome.test(nome)) {
            erros.push({mensagem: 'Nome inválido - Apenas caracteres alfanuméricos são permitidos'})
        }

        if (!isNaN(nome)) {
            erros.push({mensagem: 'Nome inválido - Não pode ser apenas números'})
        }

        if (subCategoriaExistente) {
            erros.push({mensagem: 'Nome inválido - Já existe uma subCategoria cadastrada com esse nome'})
        }

        if (nome.length < 4) {
            erros.push({mensagem: 'Nome da subcategoria inválido - Número de caracteres insuficientes'})
        }

        if (nome.length > 100) {
            erros.push({mensagem: 'Nome da subcategoria inválido - Atingiu o número máximo de caracteres'})
        }

        if (!regexSlug.test(slug)) {
            erros.push({mensagem: 'Slug inválido - Não possui o formato comum de um slug'})
        }

        if (slug.length < 3 || slug.length > 100) {
            erros.push({mensagem: 'Slug inválido - Deve conter entre 3 e 100 caracteres'});
        }

        if (slugExistente) {
            erros.push({mensagem: 'Slug inválido - Já existe uma subcategoria cadastrado com esse slug'})
        }


        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {
            if (novaImagem) {
                if (fs.existsSync(caminhoAntigo)) {
                    fs.unlink(caminhoAntigo, (err) => {
                        if (err) {
                            console.log('Erro ao deletar a imagem antiga:', err)
                        }
                    })
                }
    
                const nomeImagem = nome.replace(/\s+/g, '-').toLowerCase() + categoria.nome_categoria.replace(/\s+/g, '-').toLowerCase() + path.extname(novaImagem.originalname)
    
                const uploadPath = path.join(__dirname, '..', 'public', 'imgs', nomeImagem)
                                    
                fs.writeFile(uploadPath, novaImagem.buffer, async (err) => {
                    if (err) {
                        res.status(400).json({ mensagem: 'Erro ao salvar a imagem.' })
                        console.log('O erro é:' + err)
                    } else {
                        const novaSubCategoria = await SubCategoria.update({
                            nome_subCategoria: nome,
                            slug_subCategoria: slug,
                            imagem_subCategoria: '/imgs/' + nomeImagem,
                            id_categoria: idCategoria
                        }, { where: { id_subCategoria: id } })
    
                        res.status(200).json({ mensagem: 'SubCategoria editada com sucesso', redirect: '/Admin/SubCategorias' })
                    }
                })
    
            } else {
                if (subCategoriaAntiga.nome_subCategoria == nome &&
                    subCategoriaAntiga.slug_subCategoria == slug &&
                    subCategoriaAntiga.id_categoria == idCategoria
                ) {
                    erros.push({mensagem: 'SubCategoria igual - Se quiser editar, altere algo'})
                    res.status(400).json(erros[0])
                } else {
                    
                    const extensao = path.extname(caminhoImagemAntiga)
    
                    const nomeImagem = nome.replace(/\s+/g, '-').toLowerCase() + categoria.nome_categoria.replace(/\s+/g, '-').toLowerCase() + extensao
    
                    const caminhoNovo = path.join(__dirname, '..', 'public', 'imgs', nomeImagem)
    
                    fs.rename(caminhoAntigo, caminhoNovo, async () => {
                        const novaSubCategoria = await SubCategoria.update({
                            nome_subCategoria: nome,
                            slug_subCategoria: slug,
                            imagem_subCategoria: '/imgs/' + nomeImagem,
                            id_categoria: idCategoria
                        }, { where: { id_subCategoria: id } })
                
                        res.status(200).json({ mensagem: 'SubCategoria editada com sucesso', redirect: `/Admin/SubCategorias/${categoria.slug_categoria}` })
                    })
                }
            }
        }
    })

    router.post('/SubCategorias/Deletar', eAdmin, async (req, res) => {
        let { id, idCategoria } = req.body

        const subCategoria = await SubCategoria.findOne({ where: { id_subCategoria: id } })
        const categoria = await Categoria.findOne({ where: { id_categoria: idCategoria } })

        const imagemSubCategoria = path.join(__dirname, '..', 'public', subCategoria.imagem_subCategoria)
        await fs.promises.unlink(imagemSubCategoria)

        const produtos = await Produto.findAll({ where: { id_subCategoria: subCategoria.id_subCategoria} })

        for(const prod of produtos){
            const imagensProdutos = JSON.parse(prod.imagens_produto)

            for (const imagem of imagensProdutos) {
                const caminhoImagem  = path.join(__dirname, '..', 'public', imagem)
                await fs.promises.unlink(caminhoImagem )
            }

            const produtoDeletado = await Produto.destroy({where: { id_produto: prod.id_produto } })
        }

        const SubCategoriaDeletada = await SubCategoria.destroy({where: { id_subCategoria: subCategoria.id_subCategoria } }).then(() => {
            res.status(200).json({ mensagem: 'SubCategoria deletada com sucesso', redirect: `/Admin/SubCategorias/${categoria.slug_categoria}` })
        })
    })

    router.get('/Produtos', eAdmin, async(req, res) => {
        const produtos = await Produto.findAll({
            include: {
                model: SubCategoria,
                as: 'subcategoria',
                attributes: ['nome_subCategoria', 'id_categoria'],
                include: {
                    model: Categoria,
                    as: 'categoria',
                    attributes: ['id_categoria']
                }
            }
        })

        const produtosComImagem = produtos.map(produto => {
            const urlSub = produto.subcategoria?.nome_subCategoria.toLowerCase().trim().replace(/[\s]+/g, '-').replace(/[àáâãäå]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôõö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[ç]/g, 'c').replace(/[^a-z0-9-]/g, '')
            const imagens = JSON.parse(produto.imagens_produto)
            return {
                ...produto.dataValues,
                primeiraImagem: imagens[0],
                nomeSubCategoriaUrl: urlSub,
                idCategoria: produto.subcategoria?.categoria.id_categoria 
            }
        })
    
        res.render('admin/produtos/produtos', { produtos: produtosComImagem });
    })

    router.get('/Produtos/Adicionar', eAdmin, async(req, res) => {
        const subcategoria = await SubCategoria.findAll()
        res.render('admin/produtos/addprodutos', {subcategoria})
    })

    router.post('/Produtos/Novo', eAdmin, upload.array('imagens', 3), async(req, res) => {
        // Cria variaveis vinda do front-end
        let { nome, slug, subcategoria, info } = req.body

        const imagens = req.files

        // ----------------------Criação de variaveis--------------------------------------

        let erros = []

        const caracteresInvalidos = [    
            '!', '#', '$', '%', '*', '+', ';', '<', '=', '>', '?', '@', '[',
            '\\', ']', '^', '_', '`', '{', '|', '}', '~', '´', '¨', '¿', '¡', '\n', '\r', '\t'
        ]

        const nomeExistente = await Produto.findOne({ where: { nome_produto: nome, id_subCategoria: subcategoria } })

        const regexSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        const slugExistente = await Produto.findOne({ where: { slug_produto: slug, id_subCategoria: subcategoria } })

        const caracteresProibidos = /[<>[\]{}*+?$%^=#]/
        
    // ----------------------Validações--------------------------------------

        for (let i = 0; i < nome.length; i++) {
            if (caracteresInvalidos.includes(nome[i])) {
                erros.push({mensagem: 'Nome inválido - Possui caracteres inválidos'})
            }
        }

        if (nome.length < 3 || nome.length > 100) {
            erros.push({ mensagem: 'Nome inválido - Deve ter entre 3 e 100 caracteres' });
        }

        if (!nome.trim()) {
            erros.push({ mensagem: 'Nome inválido - Não pode ter apenas espaços em brancos' });
        }

        if (nomeExistente) {
            erros.push({mensagem: 'Nome inválido - Já existe um produto cadastrado com esse nome'})
        }

        for (let i = 0; i < slug.length; i++) {
            if (caracteresInvalidos.includes(slug[i])) {
                erros.push({mensagem: 'Slug inválido - Possui caracteres inválidos'})
            }
        }

        if (!regexSlug.test(slug)) {
            erros.push({mensagem: 'Slug inválido - Não possui o formato comum de um slug'})
        }

        if (slugExistente) {
            erros.push({mensagem: 'Slug inválido - Já existe um produto cadastrado com esse slug'})
        }

        if (info.length < 100) {
            erros.push({mensagem: 'Info do produto inválido - Número de caracteres insuficientes'})
        }

        if (info.length > 1500) {
            erros.push({mensagem: 'Info do produto inválido - Atingiu o número máximo de caracteres'})
        }

        if (caracteresProibidos.test(info)) {
            erros.push({ mensagem: 'Info do produto inválido - Possui caracteres inválidos' });
        }

        if (!info.endsWith('.')) {
            erros.push({mensagem: 'O texto deve terminar com um ponto final'})
        }

        if (info.charAt(0) !== info.charAt(0).toUpperCase()) {
            erros.push({mensagem: 'O texto deve começar com uma letra maiúscula'})
        }

        if (imagens.length !== 3) {
            erros.push({mensagem: 'Precisa-se ter três imagens'})
        }

        // ----------------------Criação no Banco de dados--------------------------------------

        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {

            const imagensCaminhos = []
            const subCategoria = await SubCategoria.findOne({where:{id_subCategoria: subcategoria}})

            for (let i = 0; i < imagens.length; i++) {
                const imagem = imagens[i]

                const nomeUnico = Date.now() + '-' + Math.floor(Math.random() * 1000)
                const nomeImagem = `${nome.replace(/\s+/g, '-').toLowerCase()}-${subCategoria.nome_subCategoria.replace(/\s+/g, '-').toLowerCase()}-${nomeUnico}${path.extname(imagem.originalname)}`

                const uploadPath = path.join(__dirname, '..', 'public', 'imgs', nomeImagem)

                fs.writeFileSync(uploadPath, imagem.buffer)

                imagensCaminhos.push(`/imgs/${nomeImagem}`)
            }

            const novoProduto = await Produto.create({
                nome_produto: nome,
                slug_produto: slug,
                imagens_produto: JSON.stringify(imagensCaminhos),
                info_produto: info,
                id_subCategoria: subcategoria
            })
            
            res.status(200).json({ mensagem: 'Produto criado com sucesso', redirect: '/Admin/Produtos/Adicionar' })
        }
    })


    router.get('/Produtos/:subcategoria/:slug/:categoriaId', eAdmin, async(req, res) => {
        const nomeSubCategoria = req.params.subcategoria.replace(/-/g, ' ').replace(/\ba\b/g, 'à').replace(/\be\b/g, 'é').replace(/\bi\b/g, 'í').replace(/\bo\b/g, 'ó').replace(/\bu\b/g, 'ú').replace(/\bc\b/g, 'ç')
        
        const subCategoriaProduto = await SubCategoria.findOne({
            where: { nome_subCategoria: nomeSubCategoria, id_categoria: req.params.categoriaId }
        })

        const editarProduto = await Produto.findOne({
            where: { slug_produto: req.params.slug, id_subCategoria: subCategoriaProduto.id_subCategoria }
        })
        
        const subcategoria = await SubCategoria.findAll({where:{id_subCategoria: {[Op.ne]: subCategoriaProduto.id_subCategoria}}})

        let imagens = []

        imagens = JSON.parse(editarProduto.imagens_produto)

        res.render('admin/produtos/editprodutos', { editarProduto, subcategoria, subCategoriaProduto, imagens })
    })

    router.post('/Produtos/Edit', eAdmin, upload.array('imagens', 3), async(req, res) => {

        let { id, nome, slug, subcategoria, info } = req.body

        const subCategoria = await SubCategoria.findOne({ where: { id_subCategoria: subcategoria } })

        const produtoAntigo = await Produto.findOne({ where: { id_produto: id } })

        const imagensAntigas = JSON.parse(req.body.imagens_antiga)

        const imagensNovas = req.files || []

        const imagensMantidas = JSON.parse(req.body.imagens_mantidas) || []

        const totalImagens = [...imagensNovas, ...imagensMantidas]

        // ---------------------------------------------------------------------------------

        let erros = []

        const caracteresInvalidos = [    
            '!', '#', '$', '%', '*', '+', ';', '<', '=', '>', '?', '@', '[',
            '\\', ']', '^', '_', '`', '{', '|', '}', '~', '´', '¨', '¿', '¡', '\n', '\r', '\t'
        ]

        const nomeExistente = await Produto.findOne({ where: { nome_produto: nome, id_produto: { [Op.ne]: id}, id_subCategoria: subcategoria } })

        const regexSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        const slugExistente = await Produto.findOne({ where: { slug_produto: slug, id_produto: { [Op.ne]: id}, id_subCategoria: subcategoria } })

        const caracteresProibidos = /[<>[\]{}*+?$%^=#]/

        const imagensCaminhos = []

        // -----------------------------------------------------------------------------------

        for (let i = 0; i < nome.length; i++) {
            if (caracteresInvalidos.includes(nome[i])) {
                erros.push({mensagem: 'Nome inválido - Possui caracteres inválidos'})
            }
        }

        if (nome.length < 3 || nome.length > 100) {
            erros.push({ mensagem: 'Nome inválido - Deve ter entre 3 e 100 caracteres' });
        }

        if (!nome.trim()) {
            erros.push({ mensagem: 'Nome inválido - Não pode ter apenas espaços em brancos' });
        }

        if (nomeExistente) {
            erros.push({mensagem: 'Nome inválido - Já existe um produto cadastrado com esse nome'})
        }

        for (let i = 0; i < slug.length; i++) {
            if (caracteresInvalidos.includes(slug[i])) {
                erros.push({mensagem: 'Slug inválido - Possui caracteres inválidos'})
            }
        }

        if (!regexSlug.test(slug)) {
            erros.push({mensagem: 'Slug inválido - Não possui o formato comum de um slug'})
        }

        if (slugExistente) {
            erros.push({mensagem: 'Slug inválido - Já existe um produto cadastrado com esse slug'})
        }

        if (info.length < 100) {
            erros.push({mensagem: 'Info do produto inválido - Número de caracteres insuficientes'})
        }

        if (info.length > 1500) {
            erros.push({mensagem: 'Info do produto inválido - Atingiu o número máximo de caracteres'})
        }

        if (caracteresProibidos.test(info)) {
            erros.push({ mensagem: 'Info do produto inválido - Possui caracteres inválidos' });
        }

        if (!info.endsWith('.')) {
            erros.push({mensagem: 'O texto deve terminar com um ponto final'})
        }

        if (info.charAt(0) !== info.charAt(0).toUpperCase()) {
            erros.push({mensagem: 'O texto deve começar com uma letra maiúscula'})
        }

        if (totalImagens.length < 3) {
            erros.push({mensagem: 'Precisa-se ter três imagens'})
        }

        // -----------------------------------------------------------------------------------

        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {
            if (imagensNovas.length > 0) {

                const imagensParaManter = imagensAntigas.filter(imagem => imagensMantidas.includes(imagem))
                const imagensParaExcluir = imagensAntigas.filter(imagem => !imagensMantidas.includes(imagem))
    
                for (let i = 0; i < imagensParaExcluir.length; i++) {
    
                    const imagensExcluir = path.join(__dirname, '..', 'public', imagensParaExcluir[i])   
    
                    if (fs.existsSync(imagensExcluir)) {
                        fs.unlink(imagensExcluir, (err) => {
                            if (err) {
                                console.log('Erro ao deletar a imagem antiga:', err)
                            }
                        })
                    }  
                }
    
                if (produtoAntigo.nome_produto !== nome || produtoAntigo.id_subCategoria !== subcategoria) {
                    for (let i = 0; i < imagensParaManter.length; i++) {
                        const imagem = imagensParaManter[i]
        
                        const extensao = path.extname(imagem)
        
                        const nomeUnico = Date.now() + '-' + Math.floor(Math.random() * 1000)
                        const nomeImagem = `${nome.replace(/\s+/g, '-').toLowerCase()}-${subCategoria.nome_subCategoria.replace(/\s+/g, '-').toLowerCase()}-${nomeUnico}${extensao}`
    
        
                        const caminhoAntigo = path.join(__dirname, '..', 'public', imagem)
                        const novoCaminho = path.join(__dirname, '..', 'public', 'imgs', nomeImagem)
        
                        fs.rename(caminhoAntigo, novoCaminho, (err) => {
                            if (err) {
                                console.log(err)
                            }
                        })
        
                        imagensCaminhos.push(`/imgs/${nomeImagem}`)
                    }
                }
    
                for (let i = 0; i < imagensNovas.length; i++) {
                    const imagem = imagensNovas[i]
    
                    const extensao = path.extname(imagem.originalname)
    
                    const nomeUnico = Date.now() + '-' + Math.floor(Math.random() * 1000)
                    const nomeImagem = `${nome.replace(/\s+/g, '-').toLowerCase()}-${subCategoria.nome_subCategoria.replace(/\s+/g, '-').toLowerCase()}-${nomeUnico}${extensao}`
                    
    
                    const uploadPath = path.join(__dirname, '..', 'public', 'imgs', nomeImagem)
    
                    fs.writeFileSync(uploadPath, imagem.buffer)
    
                    imagensCaminhos.push(`/imgs/${nomeImagem}`)
                }
    
                const novoProduto = await Produto.update({
                    nome_produto: nome,
                    slug_produto: slug,
                    imagens_produto: JSON.stringify(imagensCaminhos),
                    info_produto: info,
                    id_subCategoria: subcategoria
                }, { where: { id_produto: id } })                        
        
                res.status(200).json({ mensagem: 'Produto editado com sucesso', redirect: '/Admin/Produtos' })
    
            } else {
                if (produtoAntigo.nome_produto == nome && 
                    produtoAntigo.slug_produto == slug && 
                    produtoAntigo.id_subCategoria == subcategoria &&
                    produtoAntigo.info_produto == info
                ) {
                    erros.push({mensagem: 'Produto igual - Se quiser editar, altere algo'})
                    res.status(400).json(erros[0])
                } else {
                    for (let i = 0; i < imagensAntigas.length; i++) {
                        const imagem = imagensAntigas[i]
    
                        const extensao = path.extname(imagem)
        
                        const nomeImagem = `${nome.replace(/\s+/g, '-').toLowerCase()}-${subCategoria.nome_subCategoria.replace(/\s+/g, '-').toLowerCase()}-${i}${extensao}`
        
                        const caminhoAntigo = path.join(__dirname, '..', 'public', imagem)
    
                        const novoCaminho = path.join(__dirname, '..', 'public', 'imgs', nomeImagem)
        
                        fs.rename(caminhoAntigo, novoCaminho, (err) => {
                            if (err) {
                                console.log(err)
                            }
                        })
        
                        imagensCaminhos.push(`/imgs/${nomeImagem}`)
                    }
    
                    const novoProduto = await Produto.update({
                        nome_produto: nome,
                        slug_produto: slug,
                        imagens_produto: JSON.stringify(imagensCaminhos),
                        info_produto: info,
                        id_subCategoria: subcategoria
                    }, { where: { id_produto: id } })                        
            
                    res.status(200).json({ mensagem: 'Produto editado com sucesso', redirect: '/Admin/Produtos' })
                }
            }
        }
    })

    router.post('/Produtos/Deletar', eAdmin, async (req, res) => {
        let { id } = req.body

        const produto = await Produto.findOne({ where: { id_produto: id } })
        const imagensProdutos = JSON.parse(produto.imagens_produto)

        for (let i = 0; i < imagensProdutos.length; i++) {

            const imagem = imagensProdutos[i]
            const imagensExcluir = path.join(__dirname, '..', 'public', imagem)

            if (fs.existsSync(imagensExcluir)) {
                fs.unlinkSync(imagensExcluir, (err) => {
                    if (err) {
                        console.log('Erro ao deletar a imagem antiga:', err)
                    }
                })
            }  
        }

        const produtoDeletado = await Produto.destroy({where: { id_produto: id }}).then(() => {
            res.status(200).json({ mensagem: 'Produto deletado com sucesso', redirect: '/Admin/Produtos' })
        })
    })

    router.post('/Produtos/AtualizarEstoque', eAdmin, async (req, res) => {
        const { id_produto, estoque_produto } = req.body

        const produtoAtualizado = await Produto.update({
            estoque_produto: estoque_produto
        }, { where: { id_produto: id_produto } })

        res.status(200).json({ mensagem: 'Estoque atualizado com sucesso' })
    })

    router.get('/Categorias-Blog', eAdmin, async(req, res) => {
        const categoriasBlog = await CategoriaBlog.findAll({order: [['data_categoriaBlog', 'DESC']]})
        
        categoriasBlog.forEach(categoria => {

            const dataFormatada = new Date(categoria.dataValues.data_categoriaBlog).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(',', '')

            categoria.dataValues.data_categoriaBlog = dataFormatada
        })

        res.render('admin/blog/categoriasblog', {categoriasBlog})
    })

    router.get('/Categorias-Blog/Adicionar', eAdmin, async(req, res) => {
        res.render('admin/blog/addcategoriasblog')
    })

    router.post('/CategoriasBlog/Novo', eAdmin, async(req, res) => {
        let { nome, slug } = req.body

        // ----------------------------------------------------------------------------------

        let erros = []

        const caracteresInvalidos = [    
            '!', '#', '$', '%', '*', '+', ';', '<', '=', '>', '?', '@', '[',
            '\\', ']', '^', '_', '`', '{', '|', '}', '~', '´', '¨', '¿', '¡', '\n', '\r', '\t'
        ]

        const regexNome = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s]+$/
        const categoriaBlogExistente = await CategoriaBlog.findOne({ where: { nome_categoriaBlog: nome } })

        const regexSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        const slugBlogExistente = await CategoriaBlog.findOne({ where: { slug_categoriaBlog: slug } })

        // ----------------------------------------------------------------------------------

        for (let i = 0; i < nome.length; i++) {
            if (caracteresInvalidos.includes(nome[i])) {
                erros.push({mensagem: 'Nome inválido - Possui caracteres inválidos'})
            }
        }

        if (!nome.trim()) {
            erros.push({mensagem: 'Nome inválido - Não pode conter apenas espaços'});
        }

        if (!regexNome.test(nome)) {
            erros.push({mensagem: 'Nome inválido - Apenas caracteres alfanuméricos são permitidos'});
        }

        if (!isNaN(nome)) {
            erros.push({mensagem: 'Nome inválido - Não pode ser apenas números'});
        }

        if (categoriaBlogExistente) {
            erros.push({mensagem: 'Nome inválido - Já existe uma categoria cadastrado com esse nome'})
        }

        if (nome.length < 4) {
            erros.push({mensagem: 'Nome da categoria inválido - Número de caracteres insuficientes'})
        }

        if (nome.length > 100) {
            erros.push({mensagem: 'Nome da categoria inválido - Atingiu o número máximo de caracteres máximo'})
        }

        if (slug.length < 3 || slug.length > 50) {
            erros.push({mensagem: 'Slug inválido - Deve conter entre 3 e 50 caracteres'});
        }

        if (!regexSlug.test(slug)) {
            erros.push({mensagem: 'Slug inválido - Não possui o formato comum de um slug'})
        }

        if (slugBlogExistente) {
            erros.push({mensagem: 'Slug inválido - Já existe uma categoria cadastrada com esse slug'})
        }

        // ------------------------------------------------------------------------------------------

        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {
            const novaCategoriaBlog = await CategoriaBlog.create({
                nome_categoriaBlog: nome,
                slug_categoriaBlog: slug
            })

            res.status(200).json({ mensagem: 'Categoria do blog criada com sucesso', redirect: '/Admin/Categorias-Blog/Adicionar' })
        }
    })

    router.get('/Categorias-Blog/:slug', eAdmin, async(req, res) => {
        const editarCategoria = await CategoriaBlog.findOne({ where:{ slug_categoriaBlog: req.params.slug } })
        res.render('admin/blog/editcategoriasblog', { editarCategoria })
    })

    router.post('/CategoriasBlog/Editar', eAdmin, async(req, res) => {
        let { id, nome, slug } = req.body

        const categoriaBlogAntiga = await CategoriaBlog.findOne({ where: { id_categoriaBlog: id } })

        // ----------------------------------------------------------------------------------

        let erros = []

        const caracteresInvalidos = [    
            '!', '#', '$', '%', '*', '+', ';', '<', '=', '>', '?', '@', '[',
            '\\', ']', '^', '_', '`', '{', '|', '}', '~', '´', '¨', '¿', '¡', '\n', '\r', '\t'
        ]

        const regexNome = /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s]+$/
        const categoriaBlogExistente = await CategoriaBlog.findOne({ where: { nome_categoriaBlog: nome, id_categoriaBlog: { [Op.ne]: id} } })

        const regexSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        const slugBlogExistente = await CategoriaBlog.findOne({ where: { slug_categoriaBlog: slug, id_categoriaBlog: { [Op.ne]: id} } })

        // ----------------------------------------------------------------------------------

        for (let i = 0; i < nome.length; i++) {
            if (caracteresInvalidos.includes(nome[i])) {
                erros.push({mensagem: 'Nome inválido - Possui caracteres inválidos'})
            }
        }

        if (!nome.trim()) {
            erros.push({mensagem: 'Nome inválido - Não pode conter apenas espaços'});
        }

        if (!regexNome.test(nome)) {
            erros.push({mensagem: 'Nome inválido - Apenas caracteres alfanuméricos são permitidos'});
        }

        if (!isNaN(nome)) {
            erros.push({mensagem: 'Nome inválido - Não pode ser apenas números'});
        }

        if (categoriaBlogExistente) {
            erros.push({mensagem: 'Nome inválido - Já existe uma categoria cadastrado com esse nome'})
        }

        if (nome.length < 4) {
            erros.push({mensagem: 'Nome da categoria inválido - Número de caracteres insuficientes'})
        }

        if (nome.length > 100) {
            erros.push({mensagem: 'Nome da categoria inválido - Atingiu o número máximo de caracteres máximo'})
        }

        if (slug.length < 3 || slug.length > 50) {
            erros.push({mensagem: 'Slug inválido - Deve conter entre 3 e 50 caracteres'});
        }

        if (!regexSlug.test(slug)) {
            erros.push({mensagem: 'Slug inválido - Não possui o formato comum de um slug'})
        }

        if (slugBlogExistente) {
            erros.push({mensagem: 'Slug inválido - Já existe uma categoria cadastrada com esse slug'})
        }

        if (categoriaBlogAntiga.nome_categoriaBlog == nome && categoriaBlogAntiga.slug_categoriaBlog == slug) {
            erros.push({mensagem: 'Categoria igual - Se quiser editar, altere algo'})
        }

        // ------------------------------------------------------------------------------------------

        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {
            const editCategoriaBlog = await CategoriaBlog.update({
                nome_categoriaBlog: nome,
                slug_categoriaBlog: slug
            }, { where: { id_categoriaBlog: id } })

            res.status(200).json({ mensagem: 'Categoria do blog editada com sucesso', redirect: '/Admin/Categorias-Blog' })
        }
    })

    router.post('/CategoriasBlog/Deletar', eAdmin, async(req, res) => {
        let { id } = req.body

        const postagensBlog = await PostagemBlog.findAll({ where: { id_categoriaBlog: id } })

        for(const post of postagensBlog){

            const postDeletado = await PostagemBlog.destroy({where: { id_categoriaBlog: id  } })

        }        

        const categoriaBlogoDeletar = await CategoriaBlog.destroy({ where: { id_categoriaBlog: id } })

        res.status(200).json({ mensagem: 'Categoria do blog deletada com sucesso', redirect: '/Admin/Categorias-Blog' })
    })

    router.get('/Postagens', eAdmin, async(req, res) => {
        const postagens = await PostagemBlog.findAll({
            include: {
                model: CategoriaBlog,
                as: 'categoriaBlog'
            },
            order: [['data_postagemBlog', 'DESC']]
        })

        postagens.forEach(postagem => {

            const dataFormatada = new Date(postagem.dataValues.data_postagemBlog).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).replace(',', '')

            postagem.dataValues.data_postagemBlog = dataFormatada
        })

        res.render('admin/blog/postagensblog', { postagens })
    })

    router.get('/Postagens/Adicionar', eAdmin, async(req, res) => {
        const categoriasPostagens = await CategoriaBlog.findAll()
        res.render('admin/blog/addpostagensblog', {categoriasPostagens})
    })

    router.post('/Postagens/Nova', eAdmin, async(req, res) => {
        let { titulo, slug, descricao, conteudo, categoria } = req.body

        // ------------------------------------------------------------------------------

        let erros = []

        const caracteresInvalidos = [    
            '#', '*', ';', '<', '=', '>', '[', '\\', ']', '^', '_', 
            '`', '{', '}', '~', '´', '¨', '¿', '¡', '\n', '\r', '\t'
        ]

        const tituloExistente = await PostagemBlog.findOne({ where: { titulo_postagemBlog: titulo, id_categoriaBlog: categoria } })

        const regexSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        const slugPostagemExistente = await PostagemBlog.findOne({ where: { slug_postagemBlog: slug, id_categoriaBlog: categoria } })

        // ------------------------------------------------------------------------------

        for (let i = 0; i < titulo.length; i++) {
            if (caracteresInvalidos.includes(titulo[i])) {
                erros.push({mensagem: 'Título inválido - Possui caracteres inválidos'})
            }
        }

        if (titulo.length < 5 || titulo.length > 100) {
            erros.push({ mensagem: 'O título deve ter entre 5 e 100 caracteres' })
        }

        if (tituloExistente) {
            erros.push({ mensagem: 'Já existe uma postagem com este título' })
        }

        if (!titulo.trim()) {
            erros.push({ mensagem: 'O título não pode conter apenas espaços' })
        }

        if (!isNaN(titulo)) {
            erros.push({mensagem: 'Título inválido - Não pode ser apenas números'});
        }

        if (slug.length < 3 || slug.length > 50) {
            erros.push({mensagem: 'Slug inválido - Deve conter entre 3 e 50 caracteres'});
        }

        if (!regexSlug.test(slug)) {
            erros.push({mensagem: 'Slug inválido - Não possui o formato comum de um slug'})
        }

        if (slugPostagemExistente) {
            erros.push({mensagem: 'Slug inválido - Já existe uma postagem cadastrada com esse slug'})
        }

        if (!slug.trim()) {
            erros.push({ mensagem: 'O slug não pode conter apenas espaços' })
        }

        if (descricao.length < 20 || descricao.length > 700) {
            erros.push({ mensagem: 'A descrição deve ter entre 20 e 700 caracteres' })
        }

        if (!descricao.trim()) {
            erros.push({mensagem: 'Descrição inválida - Não pode conter apenas espaços'})
        }

        if (!isNaN(descricao)) {
            erros.push({mensagem: 'Descrição inválida - Não pode ser apenas números'})
        }

        if (conteudo.length < 100 || conteudo.length > 8000) {
            erros.push({ mensagem: 'O conteúdo deve ter entre 100 e 8000 caracteres' })
        }

        if (!conteudo.trim()) {
            erros.push({mensagem: 'Conteúdo inválido - Não pode conter apenas espaços'})
        }

        if (!isNaN(conteudo)) {
            erros.push({mensagem: 'Conteúdo inválido - Não pode ser apenas números'})
        }

        // -----------------------------------------------------------------------------

        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {
            const postagemCriada = await PostagemBlog.create({
                titulo_postagemBlog: titulo,
                slug_postagemBlog: slug,
                descricao_postagemBlog: descricao,
                conteudo_postagemBlog: conteudo,
                id_categoriaBlog: categoria
            })

            res.status(200).json({ mensagem: 'Postagem do blog criada com sucesso', redirect: '/Admin/Postagens/Adicionar' })
        }
    })

    router.get('/Postagens/:slug', eAdmin, async(req, res) => {
        const editarPostagem = await PostagemBlog.findOne({
            where: { slug_postagemBlog: req.params.slug },
            include: {
                model: CategoriaBlog,
                as: 'categoriaBlog'
            }
        })

        const categorias = await CategoriaBlog.findAll({ where: { id_categoriaBlog: { [Op.ne]: editarPostagem.id_categoriaBlog }} })
        res.render('admin/blog/editpostagensblog', {editarPostagem, categorias})
    })

    router.post('/Postagens/Editar', eAdmin, async(req, res) => {
        let { id, titulo, slug, descricao, conteudo, idCategoriaBlog } = req.body
        const postagemAntiga = await PostagemBlog.findOne({ where: { id_postagemBlog: id } })

        // ------------------------------------------------------------------------------

        let erros = []

        const caracteresInvalidos = [    
            '#', '*', ';', '<', '=', '>', '[', '\\', ']', '^', '_', 
            '`', '{', '}', '~', '´', '¨', '¿', '¡', '\n', '\r', '\t'
        ]

        const tituloExistente = await PostagemBlog.findOne({ where: { titulo_postagemBlog: titulo, id_categoriaBlog: idCategoriaBlog, id_postagemBlog: { [Op.ne]: id} } })

        const regexSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
        const slugPostagemExistente = await PostagemBlog.findOne({ where: { slug_postagemBlog: slug, id_categoriaBlog: idCategoriaBlog, id_postagemBlog: { [Op.ne]: id} } })

        // ------------------------------------------------------------------------------

        for (let i = 0; i < titulo.length; i++) {
            if (caracteresInvalidos.includes(titulo[i])) {
                erros.push({mensagem: 'Título inválido - Possui caracteres inválidos'})
            }
        }

        if (titulo.length < 5 || titulo.length > 100) {
            erros.push({ mensagem: 'O título deve ter entre 5 e 100 caracteres' })
        }

        if (tituloExistente) {
            erros.push({ mensagem: 'Já existe uma postagem com este título' })
        }

        if (!titulo.trim()) {
            erros.push({ mensagem: 'O título não pode conter apenas espaços' })
        }

        if (!isNaN(titulo)) {
            erros.push({mensagem: 'Título inválido - Não pode ser apenas números'});
        }

        if (slug.length < 3 || slug.length > 50) {
            erros.push({mensagem: 'Slug inválido - Deve conter entre 3 e 50 caracteres'});
        }

        if (!regexSlug.test(slug)) {
            erros.push({mensagem: 'Slug inválido - Não possui o formato comum de um slug'})
        }

        if (slugPostagemExistente) {
            erros.push({mensagem: 'Slug inválido - Já existe uma postagem cadastrada com esse slug'})
        }

        if (!slug.trim()) {
            erros.push({ mensagem: 'O slug não pode conter apenas espaços' })
        }

        if (descricao.length < 20 || descricao.length > 700) {
            erros.push({ mensagem: 'A descrição deve ter entre 20 e 700 caracteres' })
        }

        if (!descricao.trim()) {
            erros.push({mensagem: 'Descrição inválida - Não pode conter apenas espaços'})
        }

        if (!isNaN(descricao)) {
            erros.push({mensagem: 'Descrição inválida - Não pode ser apenas números'})
        }

        if (conteudo.length < 100 || conteudo.length > 8000) {
            erros.push({ mensagem: 'O conteúdo deve ter entre 100 e 8000 caracteres' })
        }

        if (!conteudo.trim()) {
            erros.push({mensagem: 'Conteúdo inválido - Não pode conter apenas espaços'})
        }

        if (!isNaN(conteudo)) {
            erros.push({mensagem: 'Conteúdo inválido - Não pode ser apenas números'})
        }

        if (postagemAntiga.titulo_postagemBlog == titulo && postagemAntiga.slug_postagemBlog == slug && 
            postagemAntiga.descricao_postagemBlog == descricao && postagemAntiga.conteudo_postagemBlog == conteudo &&
            postagemAntiga.id_categoriaBlog == idCategoriaBlog) {
            erros.push({mensagem: 'Categoria igual - Se quiser editar, altere algo'})
        }

        // -----------------------------------------------------------------------------

        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {
            const editPostagemBlog = await PostagemBlog.update({
                titulo_postagemBlog: titulo,
                slug_postagemBlog: slug,
                descricao_postagemBlog: descricao,
                conteudo_postagemBlog: conteudo,
                id_categoriaBlog: idCategoriaBlog
            }, { where: { id_postagemBlog: id } })

            res.status(200).json({ mensagem: 'Postagem editada com sucesso', redirect: '/Admin/Postagens' })
        }
    })

    router.post('/Postagens/Deletar', eAdmin, async(req, res) => {
        let { id } = req.body

        const PostagemBlogDeletar = await PostagemBlog.destroy({ where: { id_postagemBlog: id } })

        res.status(200).json({ mensagem: 'Postagem deletada com sucesso', redirect: '/Admin/Postagens' })        
    })

    router.get('/Orcamentos', eAdmin, async(req, res) => {

        const statusList = [ 
            {
                nome: 'Em andamento', slug: 'em-andamento'
            }, 
            {
                nome: 'Aguardando resposta do Administrador', slug: 'aguardando-resposta-do-administrador'
            }, 
            {
                nome: 'Aguardando resposta do cliente', slug: 'aguardando-resposta-do-cliente'
            }, 
            {
                nome: 'Fechado', slug: 'fechado'
            }, 
            {
                nome: 'Cancelado', slug: 'cancelado'
            }
        ]

        res.render('admin/orcamentos/orcamentos', { statusList })
    })

    router.get('/Orcamentos/:slug', eAdmin, async(req, res) => {
        const statusList = [ 
            {
                nome: 'Em andamento', slug: 'em-andamento'
            }, 
            {
                nome: 'Aguardando resposta do Administrador', slug: 'aguardando-resposta-do-administrador'
            }, 
            {
                nome: 'Aguardando resposta do cliente', slug: 'aguardando-resposta-do-cliente'
            }, 
            {
                nome: 'Fechado', slug: 'fechado'
            }, 
            {
                nome: 'Cancelado', slug: 'cancelado'
            }
        ]
        
        let slug = req.params.slug

        const status = statusList.find(item => item.slug === slug)

        const orcamentos = await Orcamento.findAll({
            where: { status_orcamento: status.nome },
            include: [
                {
                    model: Usuario,
                    as: 'usuarios',
                    attributes: ['nome_usuario']
                }
            ],
            attributes: ['data_orcamento', 'numero_orcamento']
        })

        const orcamentosObjeto = orcamentos.map(orcamento => ({
            data_orcamento: orcamento.data_orcamento,
            numero_orcamento: orcamento.numero_orcamento,
            nome_usuario: orcamento.usuarios.nome_usuario
        }))

        res.render('admin/orcamentos/orcamentoStatus', { status, orcamentosObjeto })
    })

    router.get('/Orcamentos/:slug/:num_orcamento', eAdmin, async(req, res) => {
        // EU QUERO O: ENDEREÇO ( RUA, BAIRRO, CIDADE, UF E CEP)

        // FEITO: DATA_ORCAMENTO, NUMERO_ORCAMENTO, QUANTIDADE_ITEMORÇAMENTO, NOME_PRODUTO, NOME_USUARIO, EMAIL_USUARIO, NUMERO, 
        // COMPLEMENTO,

        let slug = req.params.slug
        let numero_orcamento = req.params.num_orcamento

        const orcamento = await Orcamento.findOne({
            where: { numero_orcamento: numero_orcamento },
            include: [
                {
                    model: ItensOrcamento,
                    as: 'itensorcamento',
                    attributes: ['quantidade_itemOrcamento'],
                    include: [
                        {
                            model: Produto,
                            as: 'produtos',
                            attributes: ['nome_produto']
                        }
                    ]
                },
                {
                    model: Usuario,
                    as: 'usuarios',
                    attributes: ['id_usuario', 'nome_usuario', 'email_usuario', 'numero', 'complemento'],
                    include: [
                        {
                            model: Endereco,
                            as: 'endereco',
                            attributes: ['rua', 'bairro', 'cidade', 'uf', 'cep']
                        }
                    ]
                }
            ],
            attributes: ['data_orcamento', 'numero_orcamento', 'status_orcamento']
        })

        const dadosObjeto = {
            // Colocar oq eu consegui pegar aqui
            data_orcamento: orcamento.data_orcamento,
            numero_orcamento: orcamento.numero_orcamento,
            status_orcamento: orcamento.status_orcamento,
            id_usuario: orcamento.usuarios.id_usuario,
            nome_usuario: orcamento.usuarios.nome_usuario,
            email_usuario: orcamento.usuarios.email_usuario,
            endereco_usuario: {
                numero: orcamento.usuarios.numero,
                complemento: orcamento.usuarios.complemento,
                rua: orcamento.usuarios.endereco.rua,
                bairro: orcamento.usuarios.endereco.bairro,
                cidade: orcamento.usuarios.endereco.cidade,
                uf: orcamento.usuarios.endereco.uf,
                cep: orcamento.usuarios.endereco.cep
            },
            itens: orcamento.itensorcamento.map(item => ({
                quantidade: item.quantidade_itemOrcamento,
                nome_produto: item.produtos.nome_produto
            }))
        }

        res.render('admin/orcamentos/responderEmail', { slug, dadosObjeto })
    })

    router.post('/Orcamentos/Email-Responder', eAdmin, async(req, res) => {
        // FAZER VALIDAÇÕES

        let { num_orcamento, email_usuario, assunto, mensagem } = req.body

        let erros = []

        if (!mensagem || mensagem.trim().length < 10) {
            erros.push({ mensagem: 'Mensagem inválida (mínimo 10 caracteres).' });
        }

        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {
            const enviarOrcamento = () => {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'testetccrebites@gmail.com',
                        pass: 'dzzp ylul mejo avzr' // Ver o ngc da senha
                    }
                })
 
                const corpoEmail = mensagem
         
                const mailOptions = {
                    from: 'testetccrebites@gmail.com',
                    to: email_usuario,
                    subject: assunto,
                    text: corpoEmail
                }
 
                return transporter.sendMail(mailOptions)
            }
 
            await enviarOrcamento()
 
            const novoStatusOrcamento = await Orcamento.update({
                status_orcamento: 'Aguardando resposta do cliente'
            }, { where: { numero_orcamento: num_orcamento } })
 
            return res.status(200).json({ mensagem: 'E-mail enviado com sucesso.', redirect: '/Admin/Orcamentos'})
        }
    })

    router.post('/CancelarOrcamento', async (req, res) => {
        const num_orcamento = req.body.num_orcamento

        const orcamento = await Orcamento.findOne({
            where: { numero_orcamento: num_orcamento }
        })

        // Ver se esse if funciona depois
        if (!orcamento) {
            return res.status(404).json({ mensagem: 'Orçamento não encontrado' })
        }

        const itensOrcamento = await ItensOrcamento.findAll({
            where: { id_orcamento: orcamento.id_orcamento }
        })

        for (const item of itensOrcamento) {
            const produto = await Produto.findOne({
                where: { id_produto: item.id_produto }
            })

            if (produto) {
                await Produto.update({
                    estoque_produto: produto.estoque_produto + item.quantidade_itemOrcamento
                }, {
                    where: { id_produto: item.id_produto }
                })
            }
        }

        const cancelarOcamento = await Orcamento.update({
            status_orcamento: 'Cancelado'
        }, { where: { numero_orcamento: num_orcamento } })

        return res.status(200).json({ mensagem: 'Orçamento cancelado com sucesso', redirect: '/Admin/Orcamentos' })
    })

    router.post('/Finalizar-Orcamento', async (req, res) => {
        
        const { id_usuario, valor, itensOrcamento, num_orcamento } = req.body
        
        const criarPedido = await Pedido.create({
            valor_total_pedido: valor,
            id_usuario: id_usuario
        })

        for (const item of JSON.parse(itensOrcamento)) {

            const produto = await Produto.findOne({ where: { nome_produto: item.nome_produto } })

            await ItensPedido.create({
                quantidade_itemPedido: item.quantidade,
                id_produto: produto.id_produto,
                id_pedido: criarPedido.id_pedido
            })
        }

        const finalizarOrcamento = await Orcamento.update({
            status_orcamento: 'Fechado'
        }, { where: { numero_orcamento: num_orcamento } })

        return res.status(200).json({ mensagem: 'Pedido criado com sucesso', redirect: '/Admin/Orcamentos' })
    })

    router.get('/Pedidos', eAdmin, async (req, res) => {

        const statusList = [
            {
                nome: 'Aguardando Pagamento',
                slug: 'aguardando-pagamento'
            },
            {
                nome: 'Em separação',
                slug: 'em-separacao'
            },
            {
                nome: 'Aguardando envio',
                slug: 'aguardando-envio'
            },
            {
                nome: 'Enviado',
                slug: 'enviado'
            },
            {
                nome: 'Em rota de entrega',
                slug: 'em-rota-de-entrega'
            },
            {
                nome: 'Entregue',
                slug: 'entregue'
            },
            {
                nome: 'Entrega não realizada',
                slug: 'entrega-nao-realizada'
            },
            {
                nome: 'Devolvido',
                slug: 'devolvido'
            },
            {
                nome: 'Cancelado',
                slug: 'cancelado'
            }
        ]

        res.render('admin/pedidos/pedidos', { statusList })
    })

    router.get('/Pedidos/:slug', eAdmin, async(req, res) => {
        const statusList = [
            {
                nome: 'Aguardando Pagamento',
                slug: 'aguardando-pagamento'
            },
            {
                nome: 'Em separação',
                slug: 'em-separacao'
            },
            {
                nome: 'Aguardando envio',
                slug: 'aguardando-envio'
            },
            {
                nome: 'Enviado',
                slug: 'enviado'
            },
            {
                nome: 'Em rota de entrega',
                slug: 'em-rota-de-entrega'
            },
            {
                nome: 'Entregue',
                slug: 'entregue'
            },
            {
                nome: 'Entrega não realizada',
                slug: 'entrega-nao-realizada'
            },
            {
                nome: 'Devolvido',
                slug: 'devolvido'
            },
            {
                nome: 'Cancelado',
                slug: 'cancelado'
            }
        ]
        
        let slug = req.params.slug

        const status = statusList.find(item => item.slug === slug)

        const pedidos = await Pedido.findAll({
            where: { status_pedido: status.nome },
            include: [
                {
                    model: Usuario,
                    as: 'usuarios',
                    attributes: ['nome_usuario']
                }
            ],
            attributes: ['data_pedido', 'numero_pedido']
        })

        const pedidosObjeto = pedidos.map(pedido => ({
            data_pedido: pedido.data_pedido,
            numero_pedido: pedido.numero_pedido,
            nome_usuario: pedido.usuarios.nome_usuario
        }))

        res.render('admin/pedidos/pedidoStatus', { pedidosObjeto, status })
    })

    router.get('/Pedidos/:slug/:num_pedido', eAdmin, async(req, res) => {
        // SELECIONAR: DATA_PEDIDO, STATUS_PEDIDO, NUMERO_PEDIDO, VALOR_TOTAL_PEDIDO, NOME_USUARIO, EMAIL_USUARIO, TELEFONE_USUARIO, NUMERO
            // COMPLEMENTO, RUA, BAIRRO, CIDADE, UF, CEP, QUANTIDADE_ITEMPEDIDO, NOME_PRODUTO

        let slug = req.params.slug
        let numero_pedido = req.params.num_pedido

        const pedido = await Pedido.findOne({
            where: { numero_pedido: numero_pedido },
            include: [
                {
                    model: ItensPedido,
                    as: 'itenspedidos',
                    attributes: ['quantidade_itemPedido'],
                    include: [
                        {
                            model: Produto,
                            as: 'produtos',
                            attributes: ['nome_produto']
                        }      
                    ]
                },
                {
                    model: Usuario,
                    as: 'usuarios',
                    attributes: ['id_usuario', 'nome_usuario', 'email_usuario', 'telefone_usuario', 'numero', 'complemento'],
                    include: [
                        {
                            model: Endereco,
                            as: 'endereco',
                            attributes: ['rua', 'bairro', 'cidade', 'uf', 'cep']
                        }                        
                    ]
                }
            ],
            attributes: ['data_pedido', 'status_pedido', 'numero_pedido', 'valor_total_pedido']
        })

        const telefoneSemFormatar = pedido.usuarios.telefone_usuario
        let telefoneFormatado = null

        if (telefoneSemFormatar.length === 11) {
            telefoneFormatado = `(${telefoneSemFormatar.substring(0, 2)}) ${telefoneSemFormatar.substring(2, 7)}-${telefoneSemFormatar.substring(7)}`
        }
        
        if (telefoneSemFormatar.length === 10) {
            telefoneFormatado = `(${telefoneSemFormatar.substring(0, 2)}) ${telefoneSemFormatar.substring(2, 6)}-${telefoneSemFormatar.substring(6)}`;
        }

        let cepSemFormatacao = pedido.usuarios.endereco.cep
        let cepFormatado = null

        if (cepSemFormatacao.length === 8) {
            cepFormatado = cepSemFormatacao.substring(0, 5) + '-' + cepSemFormatacao.substring(5)
        }

        const dadosObjeto = {
            data_pedido: pedido.data_pedido,    //
            status_pedido: pedido.status_pedido,
            numero_pedido: pedido.numero_pedido,    //
            valor_total_pedido: pedido.valor_total_pedido,  //
            id_usuario: pedido.usuarios.id_usuario,
            nome_usuario: pedido.usuarios.nome_usuario, //
            email_usuario: pedido.usuarios.email_usuario,   //
            telefone_usuario: telefoneFormatado, //

            endereco_usuario: {
                numero: pedido.usuarios.numero, //
                complemento: pedido.usuarios.complemento,   //
                rua: pedido.usuarios.endereco.rua,  //
                bairro: pedido.usuarios.endereco.bairro,    //
                cidade: pedido.usuarios.endereco.cidade,    //
                uf: pedido.usuarios.endereco.uf,    //
                cep: cepFormatado   //
            },
            
            itensPedido: pedido.itenspedidos.map(item => ({
                quantidade: item.quantidade_itemPedido, //
                nome_produto: item.produtos.nome_produto    //
            }))
        }

        console.log(dadosObjeto)

        const statusOpcoes = [
            "Aguardando Pagamento",
            "Em separação",
            "Aguardando envio",
            "Enviado",
            "Em rota de entrega",
            "Entregue",
            "Entrega não realizada",
            "Devolvido",
            "Cancelado"
        ]

        res.render('admin/pedidos/trocarStatus', { slug, dadosObjeto, statusOpcoes, statusAtual: pedido.status_pedido })
    })

    router.post('/atualizar-status', eAdmin, async(req, res) => {
        const { status, numero_pedido } = req.body

        const pedidoStatus = await Pedido.findOne({
            where: { numero_pedido: numero_pedido }
        })

        let erros = []

        if (status == pedidoStatus.status_pedido) {
            erros.push({mensagem: 'Status inválido - Altere o formato do status'})
        }

        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {
            const novoStatus = await Pedido.update({
                status_pedido: status
            }, {where: { numero_pedido: numero_pedido }})

            res.status(200).json({ mensagem: 'Status editado com sucesso', redirect: '/Admin/Pedidos' })
        }
    })

    router.get('/Newsletter', eAdmin, async(req, res) => {
        const totalUsuarios = await NewsletterUsuario.count()
        const totalEmails = await NewsletterEmail.count()

        res.render('admin/newsletter/newsletter', { totalUsuarios, totalEmails })
    })

    router.get('/Newsletter/Usuarios', eAdmin, async(req, res) => {
        const usuarios = await NewsletterUsuario.findAll({
            order: [['data_inscricao', 'DESC']]
        })

        res.render('admin/newsletter/newsletterUsuarios', { usuarios })
    })

    router.get('/Newsletter/Emails', eAdmin, async(req, res) => {
        const emails = await NewsletterEmail.findAll({
            order: [['data_envio_newsletter', 'DESC']]
        })

        res.render('admin/newsletter/newsletterEmails', { emails })
    })

    router.post('/Newsletter/Emails-Newsletter', eAdmin, async(req, res) => {
        const { assunto, mensagem } = req.body
        
        let erros = []

        if (!assunto) {
            erros.push({ mensagem: "O assunto é obrigatório" });
        }

        if (!mensagem) {
            erros.push({ mensagem: "A mensagem é obrigatória" });
        }

        if (assunto.length < 5 || assunto.length > 100) {
            erros.push({ mensagem: "Assunto inválido - O assunto deve ter no mínimo 5 e máximo 100 caracteres" });
        }

        if (mensagem.length < 50 || mensagem.length > 5000) {
            erros.push({ mensagem: "Mensagem inválida - A mensagem deve ter no mínimo 50 e máximo 5000 caracteres" });
        }

        if (!assunto.trim()) {
            erros.push({ mensagem: 'O assunto não pode conter apenas espaços' })
        }

        if (!isNaN(assunto)) {
            erros.push({mensagem: 'Assunto inválido - Não pode ser apenas números'});
        }

        if (!mensagem.trim()) {
            erros.push({ mensagem: 'A mensagem não pode conter apenas espaços' })
        }

        if (!isNaN(mensagem)) {
            erros.push({mensagem: 'Mensagem inválido - Não pode ser apenas números'});
        }

        if (erros.length > 0) {
            res.status(400).json(erros[0])
        } else {

            const usuariosNewsletter = await NewsletterUsuario.findAll()

            const enviarNewsletter = async () => {
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'testetccrebites@gmail.com',
                        pass: 'dzzp ylul mejo avzr' // Ver o ngc da senha
                    }
                })
         
                const resultados = await Promise.all(
                    usuariosNewsletter.map(async (usuario) => {
                        const mailOptions = {
                            from: 'testetccrebites@gmail.com',
                            to: usuario.email_usuario_newsletter,
                            subject: assunto,
                            text: mensagem
                        }
    
                        await transporter.sendMail(mailOptions)
                    })
                )
            }

            await enviarNewsletter()

            // --------------------------------------------

            const novoNewsletter = NewsletterEmail.create({
                assunto_emails_newsletter: assunto,
                mensagem_emails_newsletter: mensagem
            })

            res.status(200).json({ mensagem: 'Newsletter enviado com sucesso', redirect: '/Admin//Newsletter' })
        }
    })

module.exports = router