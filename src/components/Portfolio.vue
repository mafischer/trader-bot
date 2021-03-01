<script>
// eslint-disable-next-line no-unused-vars
import Chart from 'chart.js';
import 'chartjs-adapter-luxon';
import { Line, mixins } from 'vue-chartjs';

const { reactiveProp } = mixins;

export default {
  extends: Line,
  mixins: [reactiveProp],
  props: {
    chartData: {
      type: Object,
      default: null,
    },
    options: {
      type: Object,
      default: null,
    },
  },
  mounted() {
    this.renderChart(this.chartData, this.options);
  },
};
</script>
