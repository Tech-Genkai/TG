<script>
        async function fetchData() {
            const response = await fetch("http:// 192.168.29.106:5000/");
            const data = await response.text();
            document.getElementById("output").innerText = data;
        }
    </script>