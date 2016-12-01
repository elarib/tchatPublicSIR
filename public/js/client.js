var socket = io();

socket.on('newSocket', function (string) {
    results.innerHTML += string + '<br>';
});

logout.addEventListener('click', function () {
    window.location.href = '/logout';
}, false);
