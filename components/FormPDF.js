const FormPDF = {
    createFormPDF(){
        return(`
            <form action="/planilha" method="post" enctype="multipart/form-data">
                <h1>PDF para planilha dados de<br> gestao do meio ambiente</h1>
                <div class="controle">
                    <div class="drop-file">
                        <div class="element-center">
                            <img src="/img/upload.svg" alt="upload img">
                            <label for="file">Brouser</label>
                        </div>
                        <input type="file" acept=".pdf" name="pdfFile" id="file" multiple="multiple">
                    </div>
                    <div class="list-file">
                    <div class="list">
                    </div>
                    <button type="submit">Gerar planilha</button>
                    </div>
                </div>
            </form>
        `)
    },
    createStyleForm(isMobile){
        return isMobile? FormPDF.styleFormPC:FormPDF.styleFormPC;
    },
    styleFormPC:`
        form
        {
            display:flex;
            flex-direction:column;
            aling-items:center;
            text-aling:center;
  
            /* background-color: red; */
            padding: 30px;
            width: 600px;
        }
        form h1
        {
            text-align: center;
        }
        form div.controle
        {
            display:flex;
            height:400px;
            
            width:150%;
            margin-left:-25%;
            margin-bottom:30px;
        }
        form div.controle div.drop-file
        {
            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:center;
            flex:1;
            border: 2px dashed #aaa;
            border-radius:10px;
            margin:10px 
        }
        form div.controle div.drop-file img
        {
            z-index:-2;
        }
        form div.controle div.list-file
        {
            display:flex;
            flex-direction:column;
            flex:1;
        }
        form div.controle div.list-file div.list
        {
            flex:1;
            display:flex;
            flex-direction:column;

        }
        form div.controle div.drop-file div.element-center
        {
            position:relative;
            top:30%;
            display:flex;
            flex-direction:column;
            
        }
        form div.controle div.drop-file div.element-center label
        {
            color:#fff;
            background:#05f;
            border-radius:5px;
            text-align:center;
            margin:20px 0;
            font-size:1.2pc;
            padding:10px 0;
        }
        input
        {
            opacity:0;
            background:blue;
            width:100%;
            position:relative;
            flex:1;
        }
        .file
        {
            display: flex;
            height: 15%;
            border-radius: 20px;
            box-shadow: 0 0 10px #aaa;
            align-items: center;
            justify-content: space-around;
        }
        .file div.icon 
        {
            height:80%;
        }
        .file div.icon img
        {
            height:40px;
        }
        form button
        {
            background:#05f;
            color:#fff;
            border:none;
            border-radius:20px;
            padding:10px 20px;
            font-size:1.2pc;
            margin:10px;
        }
    `

}

module.exports = FormPDF;