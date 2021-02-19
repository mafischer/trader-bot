<template>
  <div class="home">
    <Portfolio v-if="chartData" :chartData="chartData" :options="options"/>
  </div>
</template>

<script>
// @ is an alias for src directory
import Portfolio from '@/components/Portfolio.vue';

export default {
  name: 'Home',
  data() {
    return {
      chartData: null,
      options: null,
    };
  },
  components: {
    Portfolio,
  },
  mounted() {
    this.options = { responsive: true, maintainAspectRatio: false };
    // fetch data
    this.chartData = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      datasets: [
        {
          label: 'TSLA',
          backgroundColor: '#f87979',
          data: [100, 101, 104, 98, 110, 118, 117, 121, 119, 127, 145, 136],
        },
      ],
    };
  },
};
</script>
