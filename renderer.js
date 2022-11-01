/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */

window.addEventListener('DOMContentLoaded', () => {
	fetch('https://gh-api.reqwey.com/users/Reqwey')
		.catch((err) => {
			document.getElementById('footer').innerHTML = 'Network Error: ' + err.message;
		})
		.then(response => response.json())
		.then((data) => {
			document.getElementById('followers').textContent = data.followers;
			document.getElementById('following').textContent = data.following;
			document.getElementById('public_repos').textContent = data.public_repos;
			document.getElementById('footer').innerHTML = 'Ready';
		});
	// if ('serviceWorker' in navigator) {
	// 	window.addEventListener('load', () =>
	// 		navigator.serviceWorker.register("./sw.js?v202210311421").catch(() => { }));
	// }
})
function toggleWindowExpand() {
	document.getElementById('expandControl').style.display = 'none';
	document.getElementById('restoreControl').style.display = 'inline-block';
	window.electron.windowMax()
}
function toggleWindowRestore() {
	document.getElementById('expandControl').style.display = 'inline-block';
	document.getElementById('restoreControl').style.display = 'none';
	window.electron.windowMax()
}