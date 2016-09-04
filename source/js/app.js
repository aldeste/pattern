var lastScrollPos = window.pageYOffset;
var scrolling = false;
const header = document.querySelector('header');

function headerHide(currScroll) {
  const offput = 50;
  const currScroll = window.pageYOffset;
  const scrollingDown = currScroll - offput / 3 > lastScrollPos;
  const scrollingUp = currScroll + offput < lastScrollPos;

  if(scrollingDown && lastScrollPos > offput) {
    header.style.transform = `translate(0, -${header.offsetHeight}px)`;
    header.style.transition = 'transform 675ms cubic-bezier(0.895, 0.03, 0.685, 0.22)';
  }

  if (scrollingUp) {
    header.style.transform = '';
    header.style.transition = 'transform 675ms cubic-bezier(0.165, 0.84, 0.44, 1)';
  }

  if (scrollingDown || scrollingUp) {
    lastScrollPos = currScroll;
  }

  if ((window.innerHeight + window.scrollY) > document.body.offsetHeight - 100) {
    var loadNext = new Promise(function(resolve, reject) {
      var content = document.querySelector('main');
      var clone = content.cloneNode(true);
      resolve(clone);
    });

    loadNext.then(function(r) {
      var footer = document.querySelector('footer');
      var footerClone = footer.cloneNode(true);
      footer.parentNode.insertBefore(footerClone, footer.nextSibling);
      footerClone.parentNode.insertBefore(r, footerClone);
    });
  }

  scrolling = false;
}

window.addEventListener('scroll', function(e) {
  if (!scrolling) {
    // scrolling = true;
    window.requestAnimationFrame(headerHide);
  };
  scrolling = true;
});
