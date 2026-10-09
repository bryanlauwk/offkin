import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PairedConceptReview from './PairedConceptReview';
import {makePairedFixture} from '../test/paired-design-fixture';
afterEach(cleanup);
describe('offline paired review branch',()=>{
  it('locks owner evidence and a selected lens without paid calls or legacy storage writes',async()=>{
    const fetch=vi.spyOn(globalThis,'fetch');const store=vi.spyOn(Storage.prototype,'setItem');
    try {
      const fixture=makePairedFixture();render(<MemoryRouter><PairedConceptReview/></MemoryRouter>);
      fireEvent.change(screen.getByLabelText('Exact brand name'),{target:{value:fixture.brand}});fireEvent.click(screen.getByRole('button',{name:'Continue'}));
      fireEvent.change(screen.getByLabelText('Source excerpt or your own statement'),{target:{value:fixture.truth.quote}});
      fireEvent.click(screen.getByLabelText('I confirm this excerpt or owner statement.'));fireEvent.click(screen.getByRole('button',{name:/Choose a story lens/}));
      fireEvent.click(screen.getByLabelText('Signature action'));
      fireEvent.change(screen.getByLabelText('Brand truth → signature object'),{target:{value:fixture.symbolism}});
      fireEvent.change(screen.getByLabelText('Story-card headline'),{target:{value:fixture.card.headline}});
      fireEvent.change(screen.getByLabelText('One-sentence story'),{target:{value:fixture.card.narrative}});
      fireEvent.change(screen.getByLabelText('Product plan JSON'),{target:{value:JSON.stringify(fixture.plan)}});
      fireEvent.click(screen.getByRole('button',{name:'Lock paired design'}));
      await waitFor(()=>expect(screen.getByRole('region',{name:'Collectible specification'})).toBeInTheDocument());
      expect(screen.getByText(fixture.card.narrative)).toBeInTheDocument();expect(screen.getByText(/No images have been generated/)).toBeInTheDocument();
      expect(fetch).not.toHaveBeenCalled();expect(store).not.toHaveBeenCalled();
    } finally {fetch.mockRestore();store.mockRestore();}
  });
});