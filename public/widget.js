
(function () {
  const userId = document.currentScript.getAttribute('data-user-id');
  const agentId = document.currentScript.getAttribute('data-agent-id');

  if (!userId || !agentId) {
    console.error('AgentVerse Widget: User ID or Agent ID is missing.');
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.src = `${window.location.origin}/widget/${userId}/${agentId}`;
  iframe.style.position = 'fixed';
  iframe.style.bottom = '80px';
  iframe.style.right = '20px';
  iframe.style.width = '400px';
  iframe.style.height = '650px';
  iframe.style.border = 'none';
  iframe.style.borderRadius = '1rem'; /* 16px */
  iframe.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)';
  iframe.style.display = 'none';
  iframe.style.zIndex = '9998';
  iframe.style.opacity = '0';
  iframe.style.transform = 'translateY(20px)';
  iframe.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

  document.body.appendChild(iframe);

  const bubble = document.createElement('button');
  bubble.style.position = 'fixed';
  bubble.style.bottom = '20px';
  bubble.style.right = '20px';
  bubble.style.width = '56px';
  bubble.style.height = '56px';
  bubble.style.borderRadius = '9999px';
  bubble.style.backgroundColor = '#16a34a'; /* themeColor default */
  bubble.style.border = 'none';
  bubble.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
  bubble.style.cursor = 'pointer';
  bubble.style.display = 'flex';
  bubble.style.alignItems = 'center';
  bubble.style.justifyContent = 'center';
  bubble.style.zIndex = '9999';
  bubble.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';

  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" role="img" style="color: white;"><path d="M12 1.75C13.4892 1.75 14.9255 1.78112 16.2754 1.83887L16.3418 1.8418C17.509 1.89169 18.4719 1.93277 19.2588 2.0918C20.0995 2.26171 20.7921 2.57464 21.4023 3.18945C22.6167 4.41312 22.6298 5.95045 22.71 8.22363C22.7359 8.95905 22.75 9.72053 22.75 10.5C22.75 11.2795 22.7359 12.0409 22.71 12.7764C22.6298 15.0495 22.6167 16.5869 21.4023 17.8105C20.7921 18.4254 20.0995 18.7383 19.2588 18.9082C18.4718 19.0672 17.5091 19.1083 16.3418 19.1582L16.2754 19.1611C15.5355 19.1928 14.7696 19.2165 13.9834 19.2314C13.1863 19.2466 12.9733 19.2607 12.7988 19.3271C12.6239 19.3938 12.4615 19.5198 11.873 20.0244L9.69336 21.8936C9.4251 22.1236 9.08286 22.25 8.72949 22.25C7.91249 22.2498 7.25022 21.5875 7.25 20.7705V19.1396C6.26419 19.0959 5.43456 19.0483 4.74121 18.9082C3.90049 18.7383 3.20788 18.4254 2.59766 17.8105C1.38331 16.5869 1.37023 15.0495 1.29004 12.7764C1.26409 12.0409 1.25 11.2795 1.25 10.5C1.25 9.72053 1.26409 8.95905 1.29004 8.22363C1.37023 5.95046 1.38331 4.41312 2.59766 3.18945C3.20788 2.57464 3.90049 2.26171 4.74121 2.0918C5.52815 1.93277 6.49097 1.89169 7.6582 1.8418L7.72461 1.83887C9.0745 1.78112 10.5108 1.75 12 1.75ZM8.00879 9.5C7.45662 9.50013 7.00879 9.9478 7.00879 10.5C7.00879 11.0522 7.45662 11.4999 8.00879 11.5H8.01758L8.12012 11.4951C8.62432 11.4439 9.01758 11.0177 9.01758 10.5C9.01758 9.98227 8.62432 9.55615 8.12012 9.50488L8.01758 9.5H8.00879ZM12.0039 9.5C11.4519 9.50032 11.0039 9.94791 11.0039 10.5C11.0039 11.0521 11.4519 11.4997 12.0039 11.5H12.0137C12.5658 11.4998 13.0137 11.0521 13.0137 10.5C13.0137 9.94785 12.5658 9.50022 12.0137 9.5H12.0039ZM16 9.5C15.4478 9.50013 15 9.9478 15 10.5C15 11.0522 15.4478 11.4999 16 11.5H16.0088C16.5611 11.5 17.0088 11.0523 17.0088 10.5C17.0088 9.94773 16.5611 9.50002 16.0088 9.5H16Z" fill="currentColor"></path></svg>`;
  bubble.innerHTML = iconSvg;

  document.body.appendChild(bubble);

  let isOpen = false;

  bubble.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      iframe.style.display = 'block';
      setTimeout(() => {
        iframe.style.opacity = '1';
        iframe.style.transform = 'translateY(0)';
      }, 10);
    } else {
      iframe.style.opacity = '0';
      iframe.style.transform = 'translateY(20px)';
      setTimeout(() => {
        iframe.style.display = 'none';
      }, 300);
    }
  });

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'AV_WIDGET_CLOSE') {
      isOpen = false;
      iframe.style.opacity = '0';
      iframe.style.transform = 'translateY(20px)';
      setTimeout(() => {
        iframe.style.display = 'none';
      }, 300);
    }
  });

})();
