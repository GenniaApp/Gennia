/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */
Array.prototype.forEachAsync = async function (fn) {
	return Promise.all(this.map(fn));
};
window.addEventListener('DOMContentLoaded', () => {
	fetch('https://oi.reqwey.com/atom.xml')
		.catch((err) => {
			document.getElementById('footer').innerHTML = 'Network Error: ' + err.message;
		})
		.then(response => response.text())
		.then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
		.then(async (data) => {
			let arr = data.getElementsByTagName('entry');
			arr = Array.from(arr);
			await arr.forEachAsync(async article => {
				let title = article.getElementsByTagName('title')[0].textContent;
				let link = article.getElementsByTagName('link')[0].getAttribute('href');
				let category = article.getElementsByTagName('category');
				var seg = document.createElement("div");
				seg.className = "ui segment";
				seg.innerHTML = `<a href="${link}" style="color: black !important;" target="_blank" rel="external nofollow noopener noreferrer"><h2>${title}</h2></a><br><span class="req">${(Array.from(category)).map(x => '#' + x.getAttribute('term')).join(' ')}</span>`

				document.getElementById('contentBox').appendChild(seg);
			});
			document.getElementById('footer').innerHTML = `${arr.length} articles in total.`;
			document.getElementById('contentLoader').style.display = "none";
		})
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