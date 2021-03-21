const getData = JSON.parse(localStorage.getItem('data')) || { time: 30, number: 10, icon: "👍"};

let time = document.querySelector("#time");
let number = document.querySelector("#number");
let icon = document.querySelector("#icon");
let save = document.querySelector("#save");
let msg = document.querySelector("#msg")

time.value = getData.time
number.value = getData.number
icon.value = getData.icon

save.addEventListener("click", function(){
    localStorage.setItem('data', JSON.stringify({time: time.value, number: number.value, icon: icon.value}))
    msg.innerHTML = "Save Success Thank!!"
    setTimeout(function(){
        window.close();
    }, 1500)
})