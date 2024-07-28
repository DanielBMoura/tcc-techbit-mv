document.addEventListener('DOMContentLoaded', function () {
    // Carrossel
    const sliders = document.querySelectorAll('.slider');
    const btnVoltar = document.getElementById('voltar-button');
    const btnPassar = document.getElementById('passar-button');

    let currentSlide = 0;
    let intervalId; // Variável para armazenar o ID do intervalo

    function hideSliders() {
        sliders.forEach(item => item.classList.remove('on'));
    }

    function showSlider() {
        sliders[currentSlide].classList.add('on');
    }

    function nextSlide() {
        hideSliders();
        currentSlide = (currentSlide + 1) % sliders.length;
        showSlider();
    }

    function previousSlide() {
        hideSliders();
        currentSlide = (currentSlide - 1 + sliders.length) % sliders.length;
        showSlider();
    }

    function startSliderInterval() {
        intervalId = setInterval(nextSlide, 4000); // Muda para o próximo slide a cada 6 segundos
    }

    if (btnVoltar && btnPassar) {
        btnVoltar.addEventListener('click', () => {
            previousSlide();
            clearInterval(intervalId); // Limpa o intervalo para evitar mudanças automáticas enquanto o usuário interage
            startSliderInterval(); // Reinicia o intervalo após a interação do usuário
        });

        btnPassar.addEventListener('click', () => {
            nextSlide();
            clearInterval(intervalId); // Limpa o intervalo para evitar mudanças automáticas enquanto o usuário interage
            startSliderInterval(); // Reinicia o intervalo após a interação do usuário
        });
    }

    if (sliders.length > 0) {
        showSlider();
        startSliderInterval();
    }

    //
    // Mostrar Senha
    const campoSenha = document.querySelector("#campoSenha");
    const botaoMostrarSenha = document.querySelector("#botaoMostrarSenha");

    if (campoSenha && botaoMostrarSenha) {
        botaoMostrarSenha.addEventListener("change", function () {
            const estadoAtualDoCampoSenha = campoSenha.getAttribute("type") === "password" ? "text" : "password";
            campoSenha.setAttribute("type", estadoAtualDoCampoSenha);
        });
    }

    //
    // Responsividade Navbar
    window.openNav = function () {
        document.getElementById("mySidenav").style.width = "250px";
    }

    window.closeNav = function () {
        document.getElementById("mySidenav").style.width = "0";
    };


                    ////////////////////////////

 // Mostrar Div Rebites
 const showRebitesLink = document.getElementById('show-rebites');
 const rebitesDiv = document.getElementById('rebites');
 const closeRebitesButton = document.getElementById('close-rebites');
 const produtosBoDiv = document.querySelector('.produtosBo');

 if (showRebitesLink && rebitesDiv && closeRebitesButton) {
     showRebitesLink.addEventListener('click', function (event) {
         event.preventDefault();
         rebitesDiv.style.display = 'flex';
         rebiManualDiv.style.display = 'none';
         rebiHidroDiv.style.display = 'none';
         produtosBoDiv.style.display = 'none';
     });

     closeRebitesButton.addEventListener('click', function () {
         rebitesDiv.style.display = 'none';
         produtosBoDiv.style.display = 'flex'; // Volta a exibir produtosBo
     });
 }

 // Mostrar Div RebiManual
 const showRebiManualLink = document.getElementById('show-rebiManual');
 const rebiManualDiv = document.getElementById('rebiManual');
 const closeRebiManualButton = document.getElementById('close-rebiManual');

 if (showRebiManualLink && rebiManualDiv && closeRebiManualButton) {
     showRebiManualLink.addEventListener('click', function (event) {
         event.preventDefault();
         rebiManualDiv.style.display = 'flex';
         rebitesDiv.style.display = 'none';
         rebiHidroDiv.style.display = 'none';
         produtosBoDiv.style.display = 'none';
     });

     closeRebiManualButton.addEventListener('click', function () {
         rebiManualDiv.style.display = 'none';
         produtosBoDiv.style.display = 'flex'; // Volta a exibir produtosBo
     });
 }

 // Mostrar Div RebiHidro
 const showRebiHidroLink = document.getElementById('show-rebiHidro');
 const rebiHidroDiv = document.getElementById('rebiHidro');
 const closeRebiHidroButton = document.getElementById('close-rebiHidro');

 if (showRebiHidroLink && rebiHidroDiv && closeRebiHidroButton) {
     showRebiHidroLink.addEventListener('click', function (event) {
         event.preventDefault();
         rebiHidroDiv.style.display = 'flex';
         rebitesDiv.style.display = 'none';
         rebiManualDiv.style.display = 'none';
         produtosBoDiv.style.display = 'none';
     });

     closeRebiHidroButton.addEventListener('click', function () {
         rebiHidroDiv.style.display = 'none';
         produtosBoDiv.style.display = 'flex'; // Volta a exibir produtosBo
     });
 }
});

// mostrar2
document.addEventListener('DOMContentLoaded', function () {
    // Referências aos elementos
    const produtosBoDiv = document.getElementById('produtosBo');
    const rebitesDiv = document.getElementById('rebites');
    const rebiManualDiv = document.getElementById('rebiManual');
    const rebiHidroDiv = document.getElementById('rebiHidro');

    // Mostrar Div Rebites
    const showRebitesButton = document.getElementById('show-rebites-btn');
    const closeRebitesButton = document.getElementById('close-rebites');

    if (showRebitesButton && rebitesDiv && closeRebitesButton) {
        showRebitesButton.addEventListener('click', function (event) {
            event.preventDefault();
            rebitesDiv.style.display = 'flex';
            produtosBoDiv.style.display = 'none';
        });

        closeRebitesButton.addEventListener('click', function () {
            rebitesDiv.style.display = 'none';
            produtosBoDiv.style.display = 'flex';
        });
    }

    // Mostrar Div RebiManual
    const showRebiManualButton = document.getElementById('show-rebiManual-btn');
    const closeRebiManualButton = document.getElementById('close-rebiManual');

    if (showRebiManualButton && rebiManualDiv && closeRebiManualButton) {
        showRebiManualButton.addEventListener('click', function (event) {
            event.preventDefault();
            rebiManualDiv.style.display = 'flex';
            rebitesDiv.style.display = 'none';
            rebiHidroDiv.style.display = 'none';
            produtosBoDiv.style.display = 'none';
        });

        closeRebiManualButton.addEventListener('click', function () {
            rebiManualDiv.style.display = 'none';
            produtosBoDiv.style.display = 'flex';
        });
    }

    // Mostrar Div RebiHidro
    const showRebiHidroButton = document.getElementById('show-rebiHidro-btn');
    const closeRebiHidroButton = document.getElementById('close-rebiHidro');

    if (showRebiHidroButton && rebiHidroDiv && closeRebiHidroButton) {
        showRebiHidroButton.addEventListener('click', function (event) {
            event.preventDefault();
            rebiHidroDiv.style.display = 'flex';
            rebitesDiv.style.display = 'none';
            rebiManualDiv.style.display = 'none';
            produtosBoDiv.style.display = 'none';
        });

        closeRebiHidroButton.addEventListener('click', function () {
            rebiHidroDiv.style.display = 'none';
            produtosBoDiv.style.display = 'flex';
        });
    }
});


//carrinho seção
document.addEventListener('DOMContentLoaded', function() {
    const carrinhoDiv = document.querySelector('.carrinho a');
    const carrinhoSection = document.getElementById('carrinho-section');
    const fecharCarrinhoButton = document.getElementById('fechar-carrinho');

    carrinhoDiv.addEventListener('click', function(event) {
        event.preventDefault();
        carrinhoSection.style.display = 'block';
    });

    fecharCarrinhoButton.addEventListener('click', function() {
        carrinhoSection.style.display = 'none';
    });
});


// lupa pesquisar

document.getElementById('lupa').addEventListener('click', function(event) {
    event.preventDefault(); // Previne o comportamento padrão do link
    const input = document.getElementById('pesquisa_lupa');
    const closeBtn = document.getElementById('close-btn');
    input.style.display = 'block'; // Mostra o campo de entrada
    closeBtn.style.display = 'block'; // Mostra o botão de fechar
    input.focus(); // Foca no campo de entrada para facilitar a digitação
});

document.getElementById('close-btn').addEventListener('click', function() {
    const input = document.getElementById('pesquisa_lupa');
    const closeBtn = document.getElementById('close-btn');
    input.style.display = 'none'; // Esconde o campo de entrada
    closeBtn.style.display = 'none'; // Esconde o botão de fechar
});
