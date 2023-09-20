const button = get("#loadfile");
const header = get("#file_info");
const csvfile=get(".form_csv");
const form = get(".data_side");
const data_side = get(".data_side");

form.addEventListener("submit", event => {
    console.log('I am here.')
    event.preventDefault();
    const value=csvfile.value;
    $.get("/load_data",{data_arg:value}).done(function(data){
        file_info.innerHTML=data;
    })
});

