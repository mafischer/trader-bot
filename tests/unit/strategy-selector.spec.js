import { expect } from 'chai';
import { shallowMount } from '@vue/test-utils';
import StrategySelector from '@/components/StrategySelector.vue';

describe('StrategySelector.vue', () => {
  it('renders a div', () => {
    const wrapper = shallowMount(StrategySelector, {
      propsData: { strategies: [], elected: [] },
    });
    expect(wrapper.contains('div')).to.true;
  });
});
