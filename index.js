const { app } = require("./src/app");
const {createFormPDF,createStyleForm} = require("./components/FormPDF")
const  port  = process.env.PORT ||require("./config.json").port;
const fs = require('fs');
const requestIp = require('request-ip');
const pdf = require("pdf-parse");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 


app.get("/",(req,res)=>{
    const isMobile = req.headers['user-agent'].includes("Mobile");
    const ip = requestIp.getClientIp(req); 
    if (true) { // Ignora o endereço IPv6 do servidor
        console.log(`Endereço IP do cliente: ${ip}`);
    }
    if(isMobile){
        res.redirect("/Cellfone");
    }else{
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
    }
})

app.post("/planilha",upload.array('pdfFile'),async (req,res)=>{
    const arquivos = req.files;
    
    Promise.all(arquivos.map(arquivo => pdf(arquivo.path))).then(datas=>{
        let lines = [];
        datas.forEach(data=>{
            
            const pages = data.text.split('\n\n');
            //ler todas as paginas do documento
            
            for(pageText of pages){
                const text = pageText;
                if(text.length>20){
                    const DMR = GetDataString(text,'DMR nº',7);
                    if(DMR!=undefined){
                        const Periodo = GetDataString(text,"Periodo:",24);
                        const textTabela = GetDataString(text,"Destinador",text.length)
                        
                       //dados brutos
                        let datasTableString = SepararBruto(textTabela);
                        
                       //dados separados
                       let dataTableDataSeparada = SepararDiluido(datasTableString);
                      
                       let linesOfPage = dataTableDataSeparada.map(
                        function(data) {
                            
                            return {
                                 DMR,
                                Periodo,
                                codeIBGE:data[1],
                                resido:data[2],
                                volume:data[5][0]==','?'0'+data[5]:data[5],
                                tratamento:data[0],
                                destino:data[3]
                            }
                        });
                       
                        linesOfPage.forEach(line =>{
                            lines.push(line);
                        })
                       
                    }
                }
            }

            
        })
     //console.log(lines);
        res.render("planilha",{
            title:"Planilha DMR'S",
            dataPlanilha:{
                lines,
            }
        });
    })


})


// app.get("/bloque",(req,res)=>{
//     res.render("bloque");
// })
app.get("/Cellfone",(req,res)=>{
    res.render("cellfone");
})
app.listen(port,console.log("aberto  em https://localhost:"+port));
function GetDataString(datas,getData,lengthData){
    for(let i=0;i<datas.length;i++){
        if(datas[i] == getData[0]&& datas[i+getData.length-1] == getData[getData.length-1]){
            
            i = i+getData.length;
            let retutnSrting = '';
            for(let l =i;l<i+lengthData;l++){   
                if(datas[l]!=undefined)          
                    retutnSrting += datas[l];
            }
            return retutnSrting.trim();
        }
    }
}
function SepararDiluido(data){
    let tableReturn = [];

    for(datastring of data){
        let tableData = [];

        //console.log("data - ",datastring);


        let newdado = '';
        for(let i =0;i<datastring.length;i++){
        const char = datastring.charAt(i);
        if(tableData.length<8){
            switch(tableData.length){
                case 0://tratamento
                    if(!isNaN(char) && char.trim().length){
                        
                        tableData.push( newdado );
                        newdado = '';
                        i--;
                    }else{
                        newdado+=char;
                    }
                break;
                case 1://cod. IBGE
                    if(char=='-'){
                        tableData.push( newdado );
                        newdado = '';
                    }else{
                        if(char!="("&&char!=")"&&char!='*'){
                            newdado+=char;
                        }
                    }
                break;
                case 2://residuo
                    if(!isNaN(char) && char.trim().length && datastring[i+15]=='-'){  
                        tableData.push( newdado );
                        newdado = '';
                        i+=16;//carateres cnpj
                    }else{
                        newdado+=char;
                    }
                break;
                case 3://destino
                    if(isUnidMedida(datastring,i).isUnid){
                        tableData.push( newdado );
                        newdado = '';
                        i+=6;
                    }else{
                        newdado+=char;
                    }
                break;
                default://unidade 
                    if(tableData.length==4){
                        tableData.push("Tonelada")
                    }else{
                        let newValue = '';
                        for(let l = 0;l<datastring.length-i;l++){
                            if(datastring[i+l] == ','){
                            
                            //// console.log("virgula value =",newValue+datastring.slice(i+l,i+l+5));
                                tableData.push(newValue+datastring.slice(i+l,i+l+5));
                                i = i+l+4;
                                break;
                            }else{
                                newValue+=datastring[i+l];
                            }
                        }
                    }
                break;
            }
        }else{
            tableReturn.push(tableData)
            //console.log(tableData)
            break;
        }
    }
        
    }
    return tableReturn;
}
function isUnidMedida(text,index){
    //Tonelada ou Unidade
    return {
        isUnid: (text[index]=='T'&&text[index+7]=='a')||(text[index]=='U'&&text[index+6]=='e'),
        lengthUnid: (text[index]=='T'&&text[index+7]=='a')?8:7,
        }
}
 function SepararBruto(data){
    let newdata = '';
    let tableReturn = [];
    const arrayNumber = [0,1,2,3,4,5,6,7,8,9];
    const arrayChar = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
    for(let i =0;i<data.length;i++){
        if( isUnidMedida(data,i).isUnid){//inicio de 'Tabela'
            let contador = 8;
            for(l=contador;l<52;l++){
                const charSelect = data[i+l];
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
            
            newdata+=data.slice(i,i+contador);
            //console.log(newdata);
            tableReturn.push(newdata);
            newdata = '';
            i+=contador-1;
        }else{
            newdata+=data[i];
        }
    }
     return tableReturn;
}
