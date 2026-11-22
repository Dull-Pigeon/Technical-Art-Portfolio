const contents = document.querySelector('.case-contents');
const comparisons = document.getElementById('comparisons');

if (contents && comparisons && 'IntersectionObserver' in window) {
  contents.classList.add('can-stick');
  let observer;
  function watchSurface() {
    observer?.disconnect();
    // Sample the section behind the middle of the sticky bar, including on anchor jumps.
    const middle = Math.floor(contents.offsetHeight / 2);
    const bottom = Math.max(0, document.documentElement.clientHeight - middle - 1);
    observer = new IntersectionObserver(([entry]) => {
      contents.classList.toggle('over-comparisons', entry.isIntersecting);
    }, {rootMargin: `-${middle}px 0px -${bottom}px 0px`});
    observer.observe(comparisons);
  }
  watchSurface();
  window.addEventListener('resize', watchSurface);
}
