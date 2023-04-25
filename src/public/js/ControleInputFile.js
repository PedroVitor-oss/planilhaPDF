$("input#file").change(()=>{
    
    $("label").remove();
    $("div.cont-file").append(`
        <img src="/img/file-upload.svg" alt="file-upload"/>
    `)
})