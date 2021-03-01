<template>
  <div class="home">
    <Portfolio v-if="chartData" :chartData="chartData" :options="options"/>
  </div>
</template>

<script>
// @ is an alias for src directory
import { eachOf } from 'async-es';
// eslint-disable-next-line no-unused-vars
import { DateTime } from 'luxon';
import Portfolio from '@/components/Portfolio.vue';

const colors = ['red', 'green', 'blue', 'purple', 'orange'];

export default {
  name: 'Home',
  data() {
    return {
      chartData: null,
      options: {
        type: 'scatter',
        elements: {
          line: {
            tension: 0, // disables bezier curves
          },
        },
        scales: {
          xAxes: [{
            type: 'time',
            labelString: 'Time',
            distribution: 'series',
            time: {
              unit: 'day',
              stepSize: 1,
            },
          }],
          yAxes: [{
            labelString: 'USD ',
            stacked: true,
          }],
        },
      },
      chartDataPoll: null,
    };
  },
  components: {
    Portfolio,
  },
  created() {
    const self = this;
    // self.options = { responsive: true, maintainAspectRatio: false };
    // self.chartDataPoll = setInterval(async () => {
    setTimeout(async () => {
      const data = {
        datasets: [],
      };
      if (Object.prototype.hasOwnProperty.call(self.$store.state.brokers, 'robinhood')) {
        const historicals = await self.$store.state.brokers.robinhood.getPortfolioHistoricals({
          interval: '10minute',
          span: 'week',
        });
        let index = 0;
        await eachOf(historicals, async (series, stock, stockCb) => {
          const history = {
            data: [],
            label: stock,
            backgroundColor: colors[index],
          };
          index += 1;
          if (Object.prototype.hasOwnProperty.call(series, 'historicals')) {
            series.historicals.forEach((datum) => {
              history.data.push({
                x: datum.begins_at,
                // x: DateTime.fromISO(datum.begins_at).valueOf(),
                y: parseFloat(datum.close_price),
              });
            });
            data.datasets.push(history);
          }
          if (stockCb) {
            return stockCb();
          }
          return null;
        });
        self.chartData = data;
      }
    }, 1000);
  },
};
</script>
