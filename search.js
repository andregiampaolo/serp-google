const puppeteer = require('puppeteer');
const fs = require('fs');

//site para misturar palavras: http://seo.danzambonini.com/


let interval = null; //variável que contem a reverencia do setInterval
let searchLink = 'https://icomunicacao.com.br'; //link que o usuário quer encontrar a posição
const pageLimit = 20;//limite da quantidade de páginas pesquisadas por termo

//termos que desejo pesquisar
let term = [
  // 'agência comunicação',
  // 'agência comunicacao',
  // 'agencia comunicação',
  // 'agencia comunicacao',
  // 'agência de comunicação',
  // 'agência de comunicacao',
  // 'agencia de comunicação',
  // 'agencia de comunicacao',
  // 'agência de comunicação brasília',
  // 'agência de comunicação brasilia',
  // 'agência de comunicacao brasília',
  // 'agência de comunicacao brasilia', //erro a partir da página 16, acredito que não tem mais páginas
  // 'agencia de comunicação brasília',
  // 'agencia de comunicação brasilia',
  // 'agencia de comunicacao brasília',
  // 'agencia de comunicacao brasilia',
  // 'agência comunicação brasília',
  // 'agência comunicação brasilia',
  // 'agência comunicacao brasília', //erro a partir da página 14, acredito que não tem mais páginas
  // 'agência comunicacao brasilia', //erro a partir da página 17, acredito que não tem mais páginas
  // 'agencia comunicação brasília',
  // 'agencia comunicação brasilia',
  // 'agencia comunicacao brasília',
  'agencia comunicacao brasilia',
];
let termIndex = 0; //indice aumenta quando o usuário chegar na página limite ou encontrar o site
let pageSearch = 'https://www.google.com/search?q=' + term[termIndex].split(' ').join('+');

let results = []; //resultado é iniciado toda vez que é iniciado um novo termo
let serpNumber = 1; //indice da página de busca atual
let found = false; //variável que define se encontrou o site ou não


//inicia todas as variáveis novamente
async function nextTerm() {
  results = [];
  serpNumber = 1;
  found = false;
  termIndex = termIndex + 1;
}

async function searchNextTerm() {
  await nextTerm();
  if (term[termIndex] == undefined) {
    clearInterval(interval);
  } else {
    console.log('\nNovo termo a ser pesquisado: ', term[termIndex]);
    pageSearch = 'https://www.google.com/search?q=' + term[termIndex].split(' ').join('+');
  }
}

async function search() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(pageSearch);

  const pages = await page.evaluate(() => {
    let links_containers = document.querySelectorAll(".g>div>div>div>a");
    return Array.from(links_containers).map(link => {
      let href = link.href;
      return href.substr(0, href.split('/', 3).join('/').length);
    });
  });

  await Array.prototype.push.apply(results, pages)

  let next_page_link = await page.evaluate(() => document.body.querySelector('tbody td.cur').nextElementSibling.getElementsByTagName('a')[0].href);
  await browser.close();

  return next_page_link;
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createFile() {

  var file = fs.createWriteStream('serp/' + term[termIndex] + '.txt');
  file.on('error', function (err) { console.log('Error: ', err) });

  file.write('Termo da pesquisa: ' + term[termIndex] + ' \n');
  file.write('Página que está tentando encontrar: ' + searchLink + ' \n');

  if (found) {
    file.write('Encontrou na página ' + serpNumber + ' \n');
  } else {
    file.write('Não encontrou. Pesquisou até a página ' + pageLimit + ' \n\n');
  }

  file.write(results.join(', \n'));
  file.end();
}

async function buscar() {

  await search().then(pageNextLink => {
    console.log('Página de pesquisa: ', serpNumber);
    console.log('Link: ', pageSearch);
    if (results.includes(searchLink)) {
      console.log('Encontrou!');
      found = true;
      createFile();
      searchNextTerm();
    } else {

      if (serpNumber >= pageLimit) {
        createFile();
        searchNextTerm();
        // clearInterval(interval);
        console.log('Está além da página ' + pageLimit);
      } else {
        serpNumber = serpNumber + 1;
        console.log('Não encontrado!\n')
      }

    }
    pageSearch = pageNextLink;

  });
  await sleep(5000);
}


console.log('Página que estamos tentando encontrar o posicionamento: ', searchLink);
console.log('Termos da busca: ', term, '\n\n');
interval = setInterval(() => {
  buscar();
}, Math.round(Math.random() * 5000) + 5000);
