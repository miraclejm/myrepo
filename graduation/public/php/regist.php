<?php
    $name = $_POST["name"];
    $account = $_POST["account"];
    $password = $_POST["password"];
    $db = mysqli_connect('localhost','root','123456');
    $db_selected = mysqli_select_db($db,'graduation');
    $query = "insert into user (account,password,name)values('".$account."','".$password."','".$name."')";
    if(mysqli_query($db,$query)){
        echo 1;
    }
    else{
        echo 0;
    }
    // $result = mysqli_query($db,$query);
    /*$db = mysql_connect(SAE_MYSQL_HOST_M.':'.SAE_MYSQL_PORT,SAE_MYSQL_USER,SAE_MYSQL_PASS);
    mysql_select_db(SAE_MYSQL_DB);
    $query = "select * from feelsum ";
    $result = mysql_query($query);
    while($row = mysql_fetch_array($result)){
            $select[] = array("id"=>$row['id'],"sum"=>$row['sum']);
    }
    echo json_encode($select);*/
    mysqli_close($db);
?>