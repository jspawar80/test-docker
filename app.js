import express from 'express';
const app = express();
const port = 3000
//test();
function test()
{
  let x=undefined;
  y= x.abcdef.jkh;
}

app.get('/test', (req, res) => {
 test();
  //res.send('Hello World!test')
});

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
