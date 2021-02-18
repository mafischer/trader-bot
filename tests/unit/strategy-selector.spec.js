import { expect } from 'chai';
import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex from 'vuex'
import StrategySelector from '@/components/StrategySelector.vue';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('StrategySelector.vue', () => {
  let store;

  beforeEach(() => {
    store = new Vuex.Store({
      state: {
        cryptr: null,
        credentials: null,
        db: null,
        log: null,
        home: null,
        accounts: [],
      },
    });
  });

  it('renders a div', () => {
    const wrapper = shallowMount(StrategySelector, {
      propsData: { strategies: [], elected: [] },
      store,
      localVue,
    });
    expect(wrapper.contains('div')).to.true;
  });
});
