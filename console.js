(function() {
    'use strict';
    
    console.log('%c🎬 VK Video Link Catcher & Modifier', 'font-size: 16px; font-weight: bold; color: #4CAF50;');
    console.log('%cСкрипт запущен. Ожидание загрузки видео...', 'color: #888;');
    
    // Хранилище для уникальных ссылок
    const capturedLinks = new Set();
    const videoUrls = new Set();
    
    // Функция модификации ссылки
    function modifyVideoUrl(url) {
        try {
            const urlObj = new URL(url);
            const params = urlObj.searchParams;
            
            // Модифицируем bytes
            if (params.has('bytes')) {
                params.set('bytes', '0-99999999999');
            }
            
            // Модифицируем ct
            if (params.has('ct')) {
                params.set('ct', '0');
            }
            
            const modifiedUrl = urlObj.toString();
            
            // Сохраняем оригинальную и модифицированную ссылки
            if (!capturedLinks.has(url)) {
                capturedLinks.add(url);
                videoUrls.add(modifiedUrl);
                
                console.log('%c📥 Перехвачена ссылка:', 'color: #FF9800; font-weight: bold');
                console.log('  Оригинал:', url);
                console.log('  Модифицирована:', modifiedUrl);
                console.log('  Параметры:', {
                    expires: urlObj.searchParams.get('expires'),
                    srcIp: urlObj.searchParams.get('srcIp'),
                    id: urlObj.searchParams.get('id'),
                    bytes: urlObj.searchParams.get('bytes'),
                    ct: urlObj.searchParams.get('ct')
                });
                console.log('---');
                
                // Показываем уведомление в интерфейсе
                showNotification('✅ Видео-ссылка перехвачена!');
            }
            
            return modifiedUrl;
        } catch (e) {
            console.warn('⚠️ Ошибка при модификации URL:', e);
            return url;
        }
    }
    
    // Функция для показа уведомления на странице
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.85);
            color: #fff;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            z-index: 999999;
            border-left: 4px solid #4CAF50;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
            max-width: 400px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Анимация появления
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Автоматическое удаление через 5 секунд
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    // Перехват fetch запросов
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        let url = args[0];
        
        // Проверяем, является ли URL ссылкой на видеофрагмент
        if (typeof url === 'string' && url.includes('vkvd') && url.includes('okcdn.ru')) {
            const modifiedUrl = modifyVideoUrl(url);
            args[0] = modifiedUrl;
        } else if (url instanceof Request && url.url.includes('vkvd') && url.url.includes('okcdn.ru')) {
            const modifiedUrl = modifyVideoUrl(url.url);
            const newRequest = new Request(modifiedUrl, url);
            args[0] = newRequest;
        }
        
        return originalFetch.apply(this, args);
    };
    
    // Перехват XMLHttpRequest
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        if (typeof url === 'string' && url.includes('vkvd') && url.includes('okcdn.ru')) {
            const modifiedUrl = modifyVideoUrl(url);
            return originalOpen.call(this, method, modifiedUrl, ...rest);
        }
        return originalOpen.call(this, method, url, ...rest);
    };
    
    // Перехват создания элементов (для тегов video/source)
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(this, tagName);
        
        if (tagName.toLowerCase() === 'video' || tagName.toLowerCase() === 'source') {
            const originalSetAttribute = element.setAttribute;
            element.setAttribute = function(name, value) {
                if (name === 'src' && typeof value === 'string' && value.includes('vkvd') && value.includes('okcdn.ru')) {
                    value = modifyVideoUrl(value);
                }
                return originalSetAttribute.call(this, name, value);
            };
            
            // Перехват установки src через свойство
            Object.defineProperty(element, 'src', {
                get: function() {
                    return this.getAttribute('src');
                },
                set: function(value) {
                    if (typeof value === 'string' && value.includes('vkvd') && value.includes('okcdn.ru')) {
                        value = modifyVideoUrl(value);
                    }
                    this.setAttribute('src', value);
                }
            });
        }
        
        return element;
    };
    
    // Дополнительный функционал: кнопка для копирования всех ссылок
    function createControlPanel() {
        const panel = document.createElement('div');
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            padding: 15px;
            border-radius: 10px;
            z-index: 999998;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px;
            min-width: 200px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.1);
        `;
        
        panel.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; color: #4CAF50;">
                🎬 Видео-перехватчик
            </div>
            <div style="margin-bottom: 8px; color: #888; font-size: 12px;">
                Ссылок найдено: <span id="linkCount">0</span>
            </div>
            <button id="copyLinksBtn" style="
                background: #4CAF50;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
                margin-right: 5px;
                width: 100%;
                margin-bottom: 5px;
            ">📋 Копировать все ссылки</button>
            <button id="showLinksBtn" style="
                background: #2196F3;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
                width: 100%;
            ">👁️ Показать все ссылки</button>
        `;
        
        document.body.appendChild(panel);
        
        // Обновление счетчика
        const linkCountSpan = document.getElementById('linkCount');
        const updateCounter = () => {
            linkCountSpan.textContent = videoUrls.size;
        };
        
        // Кнопка копирования
        document.getElementById('copyLinksBtn').addEventListener('click', function() {
            const links = Array.from(videoUrls).join('\n');
            navigator.clipboard.writeText(links).then(() => {
                showNotification('✅ Ссылки скопированы в буфер обмена!');
            }).catch(() => {
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.value = links;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                textarea.remove();
                showNotification('✅ Ссылки скопированы в буфер обмена!');
            });
        });
        
        // Кнопка показа ссылок
        document.getElementById('showLinksBtn').addEventListener('click', function() {
            const links = Array.from(videoUrls).filter(item => !item.endsWith('m4s')).map(item =>`<a href="${item}">${item.slice(-10)}</a>`);
            if (links.length === 0) {
                showNotification('❌ Ссылки еще не найдены');
                return;
            }
            
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.95);
                color: #fff;
                padding: 20px;
                border-radius: 10px;
                z-index: 1000000;
                max-width: 80%;
                max-height: 80%;
                overflow: auto;
                font-family: monospace;
                font-size: 12px;
                border: 1px solid rgba(255,255,255,0.2);
                min-width: 400px;
            `;
            
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '✕';
            closeBtn.style.cssText = `
                position: sticky;
                top: 0;
                float: right;
                background: #f44336;
                color: white;
                border: none;
                padding: 5px 10px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            `;
            closeBtn.onclick = () => modal.remove();
            
            const content = document.createElement('div');
            content.innerHTML = links.join('<br/>');
            content.style.cssText = `
                color: #4CAF50;
            `;
            
            modal.appendChild(closeBtn);
            modal.appendChild(content);
            document.body.appendChild(modal);
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        });
        
        // Периодическое обновление счетчика
        setInterval(updateCounter, 1000);
        
        // Возвращаем функцию для обновления
        return updateCounter;
    }
    
    // Создаем панель управления после небольшой задержки
    setTimeout(createControlPanel, 1000);
    
    // Вывод инструкции
    console.log('%c📌 Инструкция:', 'font-weight: bold;');
    console.log('1. Скрипт автоматически перехватывает ссылки на видеофрагменты');
    console.log('2. Модифицирует параметры bytes и ct');
    console.log('3. В правом верхнем углу появилась панель управления');
    console.log('4. Используйте кнопки для копирования и просмотра ссылок');
    console.log('%c✅ Скрипт успешно активирован!', 'color: #4CAF50; font-weight: bold;');
    
    // Дополнительно: перехват всех сетевых запросов через Performance API
    if (window.PerformanceObserver) {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.name && entry.name.includes('vkvd') && entry.name.includes('okcdn.ru')) {
                    // Проверяем, не обработали ли мы уже эту ссылку
                    if (!capturedLinks.has(entry.name)) {
                        modifyVideoUrl(entry.name);
                    }
                }
            });
        });
        
        observer.observe({ entryTypes: ['resource'] });
        console.log('🔍 Performance Observer активирован для отслеживания ресурсов');
    }
    
    console.log('%c🔥 Готово! Наслаждайтесь просмотром!', 'color: #FF5722; font-weight: bold;');
    
})();