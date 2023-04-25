const { app } = require("./src/app");
const {createFormPDF,createStyleForm} = require("./components/FormPDF")
const  port  = process.env.PORT ||require("./config.json").port;
const fs = require('fs');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 


app.get("/",(req,res)=>{
    const isMobile = req.headers['user-agent'].includes("Mobile");
    res.render("home",
    {
        title:"PDF para planilha",
        isMobile,
        Form:createFormPDF(),
        htmlStyles:[
            {css:createStyleForm(isMobile)},
        ],
        styles:[
            {css:"/css/home.css"}
        ],
        scripts:[
            {js:"/js/ControleInputFile.js"}
        ]
    })
})

app.post("/planilha",upload.array('pdfFile'),(req,res)=>{
    const pdf = require("pdf-parse");
    
    const files = req.files;
    let lines = [];
    //console.log(files)
    for(file of files){
        const tempFilePath = file.path;
        const bufferFile = fs.readFileSync(tempFilePath);
    
        pdf(bufferFile).then(data=>{
            
            const pages = data.text.split('\n\n');
            //console.log(pages)
            
            for(pageText of pages){
                const text = pageText;
                if(text.length>20){
                    const DMR = GetDataString(text,'DMR nº',7);
                    if(DMR==undefined){
                        break;
                    }
                    const Periodo = GetDataString(text,"Periodo:",24);
                    const textTabela = GetDataString(text,"Destinador",text.length)
                    
                    const arrayNumber = [0,1,2,3,4,5,6,7,8,9];
                    const arrayChar = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
                    let datasTableString = []
                    let newdata = '';
                    //separador de texto bruto
                    for(let i =0;i<textTabela.length;i++){
                        if(textTabela[i]=='T'&&textTabela[i+7]=='a'){//inicio de 'Tabela'
                            let contador = 8;
                            for(l=contador;l<52;l++){
                                const charSelect = textTabela[i+l];
                                for(char of arrayChar){
                                    if(char == charSelect){
                                        //console.log(charSelect)
                                        //console.log("char que representa uma letra do alfabeto");
                                        contador = l;
                                        //console.log("contador -",contador)
                                        l=100;
                                    }
                                }
                            }
                            
                            newdata+=textTabela.slice(i,i+contador);
                            //console.log(newdata);
                            datasTableString.push(newdata);
                            newdata = '';
                            i+=contador-1;
                        }else{
                            newdata+=textTabela[i];
                        }
                    }
                    //separando texto ja diluido
                    for(datastring of datasTableString){
                        let dadosSeparados = [];
                        let newdado = '';
                        for(let i =0;i<datastring.length;i++){
                            const char = datastring.charAt(i);
                            switch(dadosSeparados.length){
                                case 0://tratamento
                                    if(!isNaN(char) && char.trim().length){
                                        
                                        dadosSeparados.push( newdado );
                                        newdado = '';
                                        i--;
                                    }else{
                                        newdado+=char;
                                    }
                                break;
                                case 1://cod. IBGE
                                    if(char=='-'){
                                        dadosSeparados.push( newdado );
                                        newdado = '';
                                    }else{
                                        if(char!="("&&char!=")"&&char!='*'){
                                            newdado+=char;
                                        }
                                    }
                                break;
                                case 2://residuo
                                    if(!isNaN(char) && char.trim().length && datastring[i+15]=='-'){  
                                        dadosSeparados.push( newdado );
                                        newdado = '';
                                        i+=16;//carateres cnpj
                                    }else{
                                        newdado+=char;
                                    }
                                break;
                                case 3://destino
                                    if(datastring[i]=='T'&&datastring[i+7]=='a'){
                                        dadosSeparados.push( newdado );
                                        newdado = '';
                                        i+=6;
                                    }else{
                                        newdado+=char;
                                    }
                                break;
                                default://unidade 
                                    if(dadosSeparados.length==4){
                                        dadosSeparados.push("Tonelada")
                                    }else{
                                        let newValue = '';
                                        for(let l = 0;l<datastring.length-i;l++){
                                            if(datastring[i+l] == ','){
                                            
                                            // console.log("virgula value =",newValue+datastring.slice(i+l,i+l+5));
                                                dadosSeparados.push(newValue+datastring.slice(i+l,i+l+5));
                                                i = i+l+4;
                                                break;
                                            }else{
                                                newValue+=datastring[i+l];
                                            }
                                        }
                                    }
                                break;
                            }
                        }

                        lines.push({
                            DMR,
                            Periodo,
                            codeIBGE:dadosSeparados[1],
                            resido:dadosSeparados[2],
                            volume:dadosSeparados[5],
                            tratamento:dadosSeparados[0],
                            destino:dadosSeparados[3]
                        })
                    }
                }
            }
            if(files.indexOf(file)==files.length-1){
                let tableSoma = [];
                for(line of lines){
                    if(tableSoma.length==0){
                        tableSoma.push({code:line.codeIBGE,residuo:line.resido,tratamento:line.tratamento,soma:parseFloat(line.volume.replace(',','.'))});
                    }else{
                        for(let i=0;i<tableSoma.length;i++){
                            let itemSoma = tableSoma[i];
                            if(itemSoma.code == line.codeIBGE){
                                itemSoma.soma+=parseFloat(line.volume.replace(',','.'))
                            }else if(i==tableSoma.length-1){
                                tableSoma.push({code:line.codeIBGE,residuo:line.resido,tratamento:line.tratamento,soma:parseFloat(line.volume.replace(',','.'))});
                            }
                        }
                    }
                }
                res.render("planilha",{
                    title:"planilha",
                    dataPlanilha:{
                        lines,
                        tableSoma,
                    }
                })
            }
        })
    }



    
   
})
app.listen(port,console.log("aberto  em https://localhost:"+port));
function GetDataString(datas,getData,lengthData){
    for(let i=0;i<datas.length;i++){
        if(datas[i] == getData[0]&& datas[i+getData.length-1] == getData[getData.length-1]){
            
            i = i+getData.length;
            let retutnSrting = '';
            for(let l =i;l<i+lengthData;l++){             
                    retutnSrting += datas[l];
            }
            return retutnSrting.trim();
        }
    }
}
