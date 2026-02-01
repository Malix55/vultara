// this file is for Generate Report feature
var svg = document.getElementsByTagName("svg")[0];
var bbox = svg.getBBox();

var diagram = document.getElementById('diagram');
var divs = diagram.getElementsByTagName('div');

let allXValues = [bbox.x]
let allYValues = [bbox.y]
for (element of divs){
    allXValues.push(parseInt(element.style.left.slice(0, -2)))
    allYValues.push(parseInt(element.style.top.slice(0, -2)))
}
allXValues = allXValues.filter(_ => !isNaN(_))
allYValues = allYValues.filter(_ => !isNaN(_))

const minX = Math.min(...allXValues)
const minY = Math.min(...allYValues)

for (element of divs){
    element.style.left = (parseInt(element.style.left.slice(0, -2)) - minX) + 'px';
    element.style.top = (parseInt(element.style.top.slice(0, -2)) - minY) + 'px';
}

svg.style.marginLeft = 0 - minX
svg.style.marginTop = 0 - minY

svg.setAttribute("viewBox", 0 + " " + 0 + " " + (bbox.x + bbox.width) + " " + (bbox.y + bbox.height));
svg.setAttribute("width", (bbox.x + bbox.width) + "px");
svg.setAttribute("height", (bbox.y + bbox.height) + "px")