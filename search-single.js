const puppeteer = require('puppeteer');
const fs = require('fs');

let interval = null;
let searchLink = 'https://icomunicacao.com.br';
let term = 'agência de comunicação';
let pageSearch = 'https://www.google.com/search?q='+term.split(' ').join('+');
const pageLimit = 10;

let results = [];
let serpNumber = 1;
let found = false;

async function search() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(pageSearch);

  const pages = await page.evaluate(() => {
    let links_containers = document.querySelectorAll(".g>div>div>div>a");
    return Array.from(links_containers).map(link => {
      let href = link.href;
      return href.substr(0,href.split('/',3).join('/').length);
    });
  });

  await Array.prototype.push.apply(results,pages)

  let next_page_link = await page.evaluate(() => document.body.querySelector('tbody td.cur').nextElementSibling.getElementsByTagName('a')[0].href);  
  await browser.close();

  return next_page_link;
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createFile(){

  var file = fs.createWriteStream(term+'.txt');
  file.on('error', function(err) { console.log('Error: ', err) });

  file.write('Termo da pesquisa: '+term+' \n');
  file.write('Página que está tentando encontrar: '+searchLink+' \n');

  if(found){
    file.write('Encontrou na página '+serpNumber+' \n');
  } else {
    file.write('Não encontrou. Pesquisou até a página '+serpNumber+' \n\n');
  }

  file.write(results.join(', \n'));
  file.end();
}

async function buscar(){
  await search().then(pageNextLink => {
    console.log('Página pesquisa: ', serpNumber);
    console.log('Link: ', pageSearch);
    if(results.includes(searchLink)){
      found = true;
      createFile();
      clearInterval(interval);
      console.log('Encontrou!');
    } else {
      if(serpNumber >= pageLimit){
        createFile();
        clearInterval(interval);
        console.log('Está além da página '+pageLimit);
      } else {
        console.log('Não encontrado!\n')
      }

    }
    pageSearch =  pageNextLink;
    serpNumber = serpNumber + 1;
  });
  await sleep(5000);
}


console.log('Página que estamos tentando encontrar o posicionamento: ', searchLink);
console.log('Termo da busca: ', term, '\n\n');
interval = setInterval(() => {
  buscar();
}, 5000);
