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
        intervalId = setInterval(nextSlide, 6000); // Muda para o próximo slide a cada 6 segundos
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

    //
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