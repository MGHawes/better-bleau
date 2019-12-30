import ApexCharts from 'apexcharts';
import * as _ from 'lodash';

function start () {
    const climbTypeStrings = Array.from(document.getElementsByClassName("btype")).map(e => e.innerText)
    const climbTypes = _.flatMap(climbTypeStrings, typesString => typesString.split(","))
    const climbTypeCounts = _.countBy(climbTypes)

    const parentNode = document.getElementsByClassName("container")[1]
    const newNode = document.createElement('div');
    parentNode.insertBefore(newNode, parentNode.firstChild);

    const data = _.map(climbTypeCounts, (count, type) => [type, count])
    const sortedData = _.sortBy(data, v => -v[1])

    const options = {
        chart: {
          type: 'bar'
        },
        series: [{
          name: 'Problem Types',
          data: sortedData.map(v => v[1])
        }],
        xaxis: {
          categories: sortedData.map(v => v[0])
        }
      }
        
    const chart = new ApexCharts(newNode, options);
    
    chart.render();
}

start();


